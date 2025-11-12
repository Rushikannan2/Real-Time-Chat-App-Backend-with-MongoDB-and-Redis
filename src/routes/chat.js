import express from 'express';
import logger from '../logger.js';
import requireAuth from '../middleware/auth.js';

const router = express.Router();

// POST /api/chat/message
// Body: { message: string }
// Protected route — client must present a valid Bearer token.
router.post('/message', requireAuth, async (req, res) => {
  const { message } = req.body;
  const user = req.user; // set by requireAuth
  if (!message) return res.status(400).json({ error: 'message required' });

  logger.info(`Received message from ${user.id || user._id}: ${message}`);

  // TODO: persist message to MongoDB or publish to Redis pub/sub / socket server

  res.json({ status: 'ok' });
});

export default router;
