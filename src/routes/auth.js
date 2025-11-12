import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import logger from '../logger.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function validateEmail(email) {
  return typeof email === 'string' && email.length >= 5 && email.includes('@');
}

// POST /api/auth/signup
// Body: { name, email, password }
router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    if (!validateEmail(email)) return res.status(400).json({ error: 'invalid email' });
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }

    // Check existing
    const existing = await User.findOne({ email: email.toLowerCase() }).exec();
    if (existing) return res.status(409).json({ error: 'email already in use' });

    // Hash password
    const passwordHash = await new Promise((resolve, reject) => {
      bcrypt.hash(password, 10, (err, hash) => (err ? reject(err) : resolve(hash)));
    });

    const user = new User({ name, email: email.toLowerCase(), passwordHash });
    await user.save();

    // Issue token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    logger.error('Signup error', err);
    next(err);
  }
});

// POST /api/auth/login
// Body: { email, password }
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() }).exec();
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'invalid credentials' });

    const ok = await new Promise((resolve) => {
      bcrypt.compare(password, user.passwordHash, (err, same) => resolve(Boolean(same && !err)));
    });

    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    logger.error('Login error', err);
    next(err);
  }
});

// GET /api/auth/me - protected
router.get('/me', requireAuth, async (req, res) => {
  // requireAuth attaches req.user with no passwordHash
  res.json({ user: req.user });
});

export default router;
