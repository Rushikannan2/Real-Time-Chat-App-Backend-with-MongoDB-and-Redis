// Environment variables are loaded by server.js before this file is imported
import express from 'express';
import http from 'http';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import logger from './logger.js';
import { connectMongoose } from './config/mongoose.js';
import { createRedisClient } from './config/redis.js';
import { createAdapter } from '@socket.io/redis-adapter';
import routes from './routes/index.js';
import Message from './models/message.js';
import ChatRoom from './models/chatRoom.js';
import User from './models/user.js';
import { enqueueSavedMessageForUser, drainQueueForUser } from './services/messageQueue.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// In-memory maps for quick socket -> user lookup. For horizontal scaling, use Redis (not implemented here).
const userToSocket = new Map(); // userId -> socketId
const socketToUser = new Map(); // socketId -> userId

app.use(express.json());

app.use('/api', routes);

app.use((err, req, res, next) => {
  logger.error(err.stack || err.message || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

async function start() {
  try {
    await connectMongoose();
  } catch (e) {
    logger.error('Mongoose startup error, continuing without DB: ' + (e.message || e));
  }

  try {
    const redisClient = await createRedisClient();
    if (redisClient) global.redisClient = redisClient; // available app-wide as needed
  } catch (e) {
    logger.error('Redis startup error, continuing without Redis: ' + (e.message || e));
  }

  // Create HTTP server to attach Socket.IO
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: { 
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173', 
      methods: ['GET', 'POST'],
      credentials: true
    },
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        console.log('[Socket.IO Auth] Connection attempt without token');
        return next(new Error('Authentication required'));
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
      console.log('[Socket.IO Auth] ========================================');
      console.log('[Socket.IO Auth] JWT_SECRET length:', JWT_SECRET.length);
      console.log('[Socket.IO Auth] JWT_SECRET first 30 chars:', JWT_SECRET.substring(0, 30));
      console.log('[Socket.IO Auth] JWT_SECRET last 30 chars:', JWT_SECRET.substring(JWT_SECRET.length - 30));
      console.log('[Socket.IO Auth] Token preview:', token.substring(0, 50) + '...');
      console.log('[Socket.IO Auth] ========================================');
      
      let payload;
      try {
        payload = jwt.verify(token, JWT_SECRET);
        console.log('[Socket.IO Auth] ✅ Token verified successfully!');
        console.log('[Socket.IO Auth] Payload:', payload);
      } catch (err) {
        console.error('[Socket.IO Auth] ❌ Token verification FAILED');
        console.error('[Socket.IO Auth] Error name:', err.name);
        console.error('[Socket.IO Auth] Error message:', err.message);
        
        // Try to decode token without verification to see what's inside
        try {
          const parts = token.split('.');
          const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log('[Socket.IO Auth] Token payload (unverified):', decodedPayload);
        } catch (e) {
          console.log('[Socket.IO Auth] Could not decode token');
        }
        
        return next(new Error('Invalid or expired token'));
      }

      if (!payload || !payload.userId) {
        console.log('[Socket.IO Auth] Token missing userId in payload:', payload);
        return next(new Error('Invalid token payload'));
      }

      const user = await User.findById(payload.userId).select('-passwordHash').exec();
      
      if (!user) {
        console.log('[Socket.IO Auth] User not found for ID:', payload.userId);
        return next(new Error('User not found'));
      }

      // Attach user to socket for use in handlers
      socket.userId = String(user._id);
      socket.user = user;
      console.log(`[Socket.IO Auth] ✓ Authenticated socket ${socket.id} for user ${user.email}`);
      next();
    } catch (err) {
      console.error('[Socket.IO Auth] Unexpected authentication error:', err);
      next(new Error('Authentication failed'));
    }
  });

  // If Redis is available, attach the Socket.IO Redis adapter for horizontal scaling
  if (global.redisClient) {
    try {
      // duplicate clients for the adapter (pub/sub)
      const pubClient = global.redisClient.duplicate();
      const subClient = global.redisClient.duplicate();
      await pubClient.connect();
      await subClient.connect();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Attached Socket.IO Redis adapter (pub/sub)');
    } catch (e) {
      logger.warn('Failed to attach Socket.IO Redis adapter: ' + (e.message || e));
    }
  }

  // Presence helpers using Redis sets
  const addSocketForUser = async (userId, socketId) => {
    if (!global.redisClient || !userId || !socketId) return;
    try {
      await global.redisClient.sAdd(`user:${userId}:sockets`, String(socketId));
      await global.redisClient.sAdd('online_users', String(userId));
      // publish presence change
      await global.redisClient.publish('presence', JSON.stringify({ userId: String(userId), online: true }));
    } catch (err) {
      logger.warn('addSocketForUser error: ' + (err.message || err));
    }
  };

  const removeSocketForUser = async (userId, socketId) => {
    if (!global.redisClient || !userId || !socketId) return;
    try {
      await global.redisClient.sRem(`user:${userId}:sockets`, String(socketId));
      const remaining = await global.redisClient.sCard(`user:${userId}:sockets`);
      if (!remaining) {
        await global.redisClient.sRem('online_users', String(userId));
        await global.redisClient.publish('presence', JSON.stringify({ userId: String(userId), online: false }));
      }
    } catch (err) {
      logger.warn('removeSocketForUser error: ' + (err.message || err));
    }
  };

  // Socket.IO event handlers
  io.on('connection', async (socket) => {
    const userId = socket.userId; // Set by auth middleware
    logger.info(`Socket connected: ${socket.id} for user ${userId}`);
    console.log(`[Socket.IO] User ${socket.user?.email} connected with socket ${socket.id}`);

    // User is already authenticated via middleware
    if (userId) {
      userToSocket.set(userId, socket.id);
      socketToUser.set(socket.id, userId);
      // add to Redis presence
      await addSocketForUser(userId, socket.id);
      
      // Drain any queued messages for this user and deliver now
      try {
        await drainQueueForUser(userId, async (msgObj) => {
          // emit to this socket only
          socket.emit('receiveMessage', msgObj);
          console.log(`[Socket.IO] Delivered queued message ${msgObj._id} to user ${userId}`);
          // update DB to mark delivered
          try {
            if (msgObj && msgObj._id) {
              await Message.findByIdAndUpdate(msgObj._id, { $addToSet: { deliveredTo: userId } }).exec();
            }
          } catch (e) {
            console.error('[Socket.IO] Failed to mark queued message delivered:', e);
            logger.warn('Failed to mark queued message delivered in DB: ' + (e.message || e));
          }
        });
      } catch (e) {
        console.error('[Socket.IO] drainQueueForUser failed on connection:', e);
        logger.warn('drainQueueForUser failed on connection handshake: ' + (e.message || e));
      }
    }

    // Join a room
    socket.on('joinRoom', (roomId) => {
      if (!roomId) return;
      socket.join(roomId);
      logger.info(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Leave a room
    socket.on('leaveRoom', (roomId) => {
      if (!roomId) return;
      socket.leave(roomId);
      logger.info(`Socket ${socket.id} left room ${roomId}`);
    });

    // sendMessage: persist then broadcast
    // payload: { room, content, attachments?, metadata? }
    socket.on('sendMessage', async (payload) => {
      try {
        if (!payload || !payload.room || !payload.content) {
          console.log('[Socket.IO] sendMessage - Invalid payload:', payload);
          socket.emit('error', { message: 'Invalid sendMessage payload: room and content required' });
          return;
        }

        const senderId = socket.userId; // Use authenticated userId
        if (!senderId) {
          console.log('[Socket.IO] sendMessage - No authenticated user');
          socket.emit('error', { message: 'Authentication required' });
          return;
        }

        const msg = new Message({
          room: payload.room,
          sender: senderId,
          content: payload.content,
          attachments: payload.attachments || [],
          metadata: payload.metadata || {},
        });

        const saved = await msg.save();
        console.log(`[Socket.IO] Message saved: ${saved._id} from user ${senderId} to room ${payload.room}`);

        // Populate sender info before broadcasting
        const populatedMessage = await Message.findById(saved._id).populate('sender', 'name email').exec();
        
        // Update chat room's lastMessageAt for ordering
        try {
          await ChatRoom.findByIdAndUpdate(payload.room, { lastMessageAt: saved.createdAt || new Date() }).exec();
        } catch (e) {
          logger.warn('Failed to update ChatRoom.lastMessageAt: ' + (e.message || e));
        }

        // Push into Redis-backed queue for workers to consume (durable-ish)
        try {
          if (global.redisClient) {
            const msgObj = saved.toObject ? saved.toObject() : saved;
            await global.redisClient.rPush('queue:messages', JSON.stringify(msgObj));
          }
        } catch (e) {
          logger.warn('Failed to push message to Redis queue: ' + (e.message || e));
        }

        // Broadcast populated message to all sockets in the room (including sender)
        // With the Redis adapter attached this will propagate across server instances.
        io.to(String(payload.room)).emit('receiveMessage', populatedMessage);

        // Determine participants and enqueue message for offline users (and mark delivered for online ones)
        try {
          const roomDoc = await ChatRoom.findById(payload.room).select('participants').lean();
          if (roomDoc && Array.isArray(roomDoc.participants) && roomDoc.participants.length) {
            const participants = roomDoc.participants.map((p) => String(p));
            const messageSenderId = String(saved.sender);
            console.log(`[Socket.IO] Processing delivery for ${participants.length} participants in room ${payload.room}`);
            // For each participant except sender, check presence
            for (const participantId of participants) {
              if (participantId === senderId) continue;
              let isOnline = false;
              try {
                if (global.redisClient) {
                  const sockets = await global.redisClient.sCard(`user:${participantId}:sockets`);
                  isOnline = !!sockets;
                }
              } catch (e) {
                // fallback to presence set check
                try {
                  const online = await global.redisClient.sIsMember('online_users', String(participantId));
                  isOnline = !!online;
                } catch (ee) {
                  isOnline = false;
                }
              }

              if (isOnline) {
                // Mark delivered in DB so we track per-user delivery
                console.log(`[Socket.IO] User ${participantId} is online, marking message as delivered`);
                try {
                  await Message.findByIdAndUpdate(saved._id, { $addToSet: { deliveredTo: participantId } }).exec();
                } catch (e) {
                  console.error('[Socket.IO] Failed to mark message delivered:', e);
                  logger.warn('Failed to mark message delivered for ' + participantId + ': ' + (e.message || e));
                }
              } else {
                // enqueue for later delivery
                console.log(`[Socket.IO] User ${participantId} is offline, enqueueing message`);
                try {
                  await enqueueSavedMessageForUser(participantId, saved);
                } catch (e) {
                  console.error('[Socket.IO] Failed to enqueue message for offline user:', e);
                  logger.warn('Failed to enqueue message for offline user ' + participantId + ': ' + (e.message || e));
                }
              }
            }
          }
        } catch (e) {
          console.error('[Socket.IO] Error computing offline recipients:', e);
          logger.warn('Error while computing offline recipients: ' + (e.message || e));
        }
      } catch (e) {
        console.error('[Socket.IO] sendMessage handler error:', e.stack || e);
        logger.error('sendMessage handler error: ' + (e.stack || e));
        socket.emit('error', { message: 'sendMessage failed' });
      }
    });

    // typing: { room, userId, typing: true/false }
    socket.on('typing', (data) => {
      try {
        if (!data || !data.room) return;
        // broadcast to others in room that user is typing
        socket.to(String(data.room)).emit('typing', { userId: data.userId, typing: !!data.typing });
      } catch (e) {
        logger.warn('typing handler error: ' + (e.message || e));
      }
    });

    // Allow clients to set their userId after connecting
    socket.on('setup', (userId) => {
      if (!userId) return;
      userToSocket.set(String(userId), socket.id);
      socketToUser.set(socket.id, String(userId));
      addSocketForUser(String(userId), socket.id);
      logger.info(`Setup mapping socket ${socket.id} -> user ${userId}`);
      // Drain queued messages for user once they've set up their identity
      (async () => {
        try {
          const uid = String(userId);
          await drainQueueForUser(uid, async (msgObj) => {
            socket.emit('receiveMessage', msgObj);
            try {
              if (msgObj && msgObj._id) {
                await Message.findByIdAndUpdate(msgObj._id, { $addToSet: { deliveredTo: uid } }).exec();
              }
            } catch (e) {
              logger.warn('Failed to mark queued message delivered in DB: ' + (e.message || e));
            }
          });
        } catch (e) {
          logger.warn('drainQueueForUser failed on setup: ' + (e.message || e));
        }
      })();
    });

    socket.on('disconnect', (reason) => {
      const uid = socketToUser.get(socket.id);
      if (uid) userToSocket.delete(uid);
      socketToUser.delete(socket.id);
      // remove from Redis presence
      removeSocketForUser(uid, socket.id);
      logger.info(`Socket disconnected: ${socket.id} reason=${reason} user=${uid || 'unknown'}`);
    });
  });

  server.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));
}

start();
