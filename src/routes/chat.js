import express from 'express';
import logger from '../logger.js';

const router = express.Router();

// POST /api/chat/message
// Body: { user: string, message: string }
router.post('/message', async (req, res) => {
  const { user, message } = req.body;
  if (!user || !message) return res.status(400).json({ error: 'user and message required' });

  logger.info(`Received message from ${user}: ${message}`);

  // TODO: persist message to MongoDB or publish to Redis pub/sub / socket server

  res.json({ status: 'ok' });
});

export default router;
