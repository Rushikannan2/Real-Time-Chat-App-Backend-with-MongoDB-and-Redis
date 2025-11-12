import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import logger from '../logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

/**
 * Express middleware to protect routes.
 * Expects Authorization: Bearer <token>
 * Attaches `req.user` (mongoose document) on success.
 */
export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || typeof auth !== 'string') return res.status(401).json({ error: 'Missing Authorization header' });

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return res.status(401).json({ error: 'Invalid Authorization header format' });
    }

    const token = parts[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // payload should include userId
    if (!payload || !payload.userId) return res.status(401).json({ error: 'Invalid token payload' });

    const user = await User.findById(payload.userId).select('-passwordHash').exec();
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    logger.error('Auth middleware error', err);
    next(err);
  }
}

export default requireAuth;
