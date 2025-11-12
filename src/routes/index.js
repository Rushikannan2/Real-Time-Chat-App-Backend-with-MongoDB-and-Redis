import express from 'express';
import chatRouter from './chat.js';
import authRouter from './auth.js';
import roomsRouter from './rooms.js';

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

router.use('/chat', chatRouter);
router.use('/auth', authRouter);
router.use('/rooms', roomsRouter);

export default router;
