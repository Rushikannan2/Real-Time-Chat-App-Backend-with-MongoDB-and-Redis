import express from 'express';
import chatRouter from './chat.js';

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

router.use('/chat', chatRouter);

export default router;
