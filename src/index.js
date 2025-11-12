import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import logger from './logger.js';
import { connectMongoose } from './config/mongoose.js';
import { createRedisClient } from './config/redis.js';
import routes from './routes/index.js';
import Message from './models/message.js';
import ChatRoom from './models/chatRoom.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
    cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Optional: client may pass userId in handshake query (or emit a 'setup' event)
    const handshakeUserId = socket.handshake?.query?.userId;
    if (handshakeUserId) {
      userToSocket.set(String(handshakeUserId), socket.id);
      socketToUser.set(socket.id, String(handshakeUserId));
      logger.info(`Associated socket ${socket.id} with user ${handshakeUserId}`);
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
    // payload: { room, sender, content, attachments?, metadata? }
    socket.on('sendMessage', async (payload) => {
      try {
        if (!payload || !payload.room || !payload.sender) {
          socket.emit('error', { message: 'Invalid sendMessage payload' });
          return;
        }

        const msg = new Message({
          room: payload.room,
          sender: payload.sender,
          content: payload.content || '',
          attachments: payload.attachments || [],
          metadata: payload.metadata || {},
        });

        const saved = await msg.save();

        // Update chat room's lastMessageAt for ordering
        try {
          await ChatRoom.findByIdAndUpdate(payload.room, { lastMessageAt: saved.createdAt || new Date() }).exec();
        } catch (e) {
          logger.warn('Failed to update ChatRoom.lastMessageAt: ' + (e.message || e));
        }

        // Broadcast to all sockets in the room (including sender)
        io.to(String(payload.room)).emit('receiveMessage', saved);
      } catch (e) {
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
      logger.info(`Setup mapping socket ${socket.id} -> user ${userId}`);
    });

    socket.on('disconnect', (reason) => {
      const uid = socketToUser.get(socket.id);
      if (uid) userToSocket.delete(uid);
      socketToUser.delete(socket.id);
      logger.info(`Socket disconnected: ${socket.id} reason=${reason} user=${uid || 'unknown'}`);
    });
  });

  server.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));
}

start();
