import express from 'express';
import mongoose from 'mongoose';
import requireAuth from '../middleware/auth.js';
import ChatRoom from '../models/chatRoom.js';
import Message from '../models/message.js';
import User from '../models/user.js';

const router = express.Router();

// Create a chat room
// POST /api/rooms
// Body: { name?, isPrivate?, participants?: [userId] }
router.post('/', requireAuth, async (req, res) => {
  try {
    const creator = req.user;
    const { name, isPrivate = false, participants = [] } = req.body || {};

    // Ensure participants is an array and include creator
    const parts = Array.isArray(participants) ? participants.map(String) : [];
    if (!parts.includes(String(creator._id))) parts.unshift(String(creator._id));

    // Validate users exist (optional but helpful)
    const uniqueIds = [...new Set(parts)];
    const userObjs = await User.find({ _id: { $in: uniqueIds } }).select('_id').lean();
    if (!userObjs || !userObjs.length) return res.status(400).json({ error: 'No valid participants provided' });

    const room = new ChatRoom({
      name: name || null,
      isPrivate: !!isPrivate,
      participants: userObjs.map((u) => u._id),
      lastMessageAt: null,
    });

    const saved = await room.save();
    return res.status(201).json({ room: saved });
  } catch (err) {
    console.error('Create room error', err);
    return res.status(500).json({ error: 'Failed to create room' });
  }
});

// Fetch rooms for the authenticated user, including last message via aggregation
// GET /api/rooms
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const objectUserId = mongoose.Types.ObjectId(String(userId));

    // Aggregate rooms where the user is a participant
    const rooms = await ChatRoom.aggregate([
      { $match: { participants: objectUserId } },
      // Lookup last message for each room
      {
        $lookup: {
          from: 'messages',
          let: { roomId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$room', '$$roomId'] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { _id: 1, content: 1, sender: 1, createdAt: 1, attachments: 1 } },
          ],
          as: 'lastMessage',
        },
      },
      { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
      // Populate basic participant info
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participantsInfo',
        },
      },
      // Project only what we want to send
      {
        $project: {
          name: 1,
          isPrivate: 1,
          slug: 1,
          participants: 1,
          participantsInfo: { _id: 1, name: 1, email: 1, avatarUrl: 1 },
          lastMessage: 1,
          lastMessageAt: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      // Sort rooms by lastMessageAt (fallback to updatedAt)
      { $sort: { lastMessageAt: -1, updatedAt: -1 } },
    ]).exec();

    return res.json({ rooms });
  } catch (err) {
    console.error('Fetch rooms error', err);
    return res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get all available rooms (public rooms + rooms user is in)
// GET /api/rooms/available
router.get('/available', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all non-private rooms
    const rooms = await ChatRoom.find({ isPrivate: false })
      .select('name participants isPrivate createdAt')
      .populate('participants', 'name email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Mark which rooms the user is already in
    const roomsWithStatus = rooms.map(room => ({
      ...room,
      isMember: room.participants.some(p => String(p._id) === String(userId))
    }));

    return res.json({ rooms: roomsWithStatus });
  } catch (err) {
    console.error('Fetch available rooms error', err);
    return res.status(500).json({ error: 'Failed to fetch available rooms' });
  }
});

// Join a room (add yourself as participant)
// POST /api/rooms/:roomId/join
router.post('/:roomId/join', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const room = await ChatRoom.findById(roomId).exec();
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Check if room is private
    if (room.isPrivate) {
      return res.status(403).json({ error: 'Cannot join private rooms. You must be invited.' });
    }

    // Check if already a participant
    if (room.participants.map(String).includes(String(userId))) {
      return res.status(400).json({ error: 'You are already a member of this room' });
    }

    // Add user to participants
    const updated = await ChatRoom.findByIdAndUpdate(
      roomId, 
      { $addToSet: { participants: userId } }, 
      { new: true }
    ).populate('participants', 'name email').exec();

    console.log(`[Rooms] User ${req.user.email} joined room ${room.name || roomId}`);
    return res.json({ room: updated });
  } catch (err) {
    console.error('Join room error', err);
    return res.status(500).json({ error: 'Failed to join room' });
  }
});

// Add a user to a room
// POST /api/rooms/:roomId/users
// Body: { userId }
router.post('/:roomId/users', requireAuth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Ensure room exists and requester is a participant (simple permission model)
    const room = await ChatRoom.findById(roomId).exec();
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const requesterId = String(req.user._id);
    const isParticipant = (room.participants || []).map(String).includes(requesterId);
    if (!isParticipant) return res.status(403).json({ error: 'Only participants can add users to the room' });

    // Ensure target user exists
    const target = await User.findById(userId).select('_id').lean();
    if (!target) return res.status(404).json({ error: 'User to add not found' });

    // Add to participants set
    const updated = await ChatRoom.findByIdAndUpdate(roomId, { $addToSet: { participants: target._id } }, { new: true }).exec();
    return res.json({ room: updated });
  } catch (err) {
    console.error('Add user to room error', err);
    return res.status(500).json({ error: 'Failed to add user to room' });
  }
});

export default router;
