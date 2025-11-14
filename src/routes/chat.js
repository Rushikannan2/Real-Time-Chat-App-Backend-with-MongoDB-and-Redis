import express from 'express';
import logger from '../logger.js';
import requireAuth from '../middleware/auth.js';
import Message from '../models/message.js';
import ChatRoom from '../models/chatRoom.js';

const router = express.Router();

// POST /api/chat/:roomId
// Send a message to a chat room
// Protected route
router.post('/:roomId', requireAuth, async (req, res) => {
  const { message } = req.body;
  const { roomId } = req.params;
  const user = req.user; // set by requireAuth

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Optional: Check if the user is a participant
    if (!room.participants.map(p => p.toString()).includes(user._id.toString())) {
      return res.status(403).json({ error: 'You are not a member of this chat room.' });
    }

    const newMessage = new Message({
      room: roomId,
      sender: user._id,
      message: message,
    });

    await newMessage.save();
    
    // Populate sender info to include user details in the response
    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name email');

    logger.info(`Message from ${user.email} to room ${roomId}: ${message}`);
    res.status(201).json(populatedMessage);
  } catch (error) {
    logger.error(`Error sending message to room ${roomId}:`, error);
    res.status(500).json({ error: 'Server error while sending message' });
  }
});

// GET /api/chat/:roomId
// Get all messages for a chat room
// Protected route
router.get('/:roomId', requireAuth, async (req, res) => {
  const { roomId } = req.params;
  const user = req.user;

  try {
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Optional: Check if the user is a participant
    if (!room.participants.map(p => p.toString()).includes(user._id.toString())) {
      return res.status(403).json({ error: 'You are not a member of this chat room.' });
    }

    const messages = await Message.find({ chatRoom: roomId })
      .populate('sender', 'name email')
      .sort({ createdAt: 'asc' });

    res.json(messages);
  } catch (error) {
    logger.error(`Error fetching messages for room ${roomId}:`, error);
    res.status(500).json({ error: 'Server error while fetching messages' });
  }
});

export default router;
