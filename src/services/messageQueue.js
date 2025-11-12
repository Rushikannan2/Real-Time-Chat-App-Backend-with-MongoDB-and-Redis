import logger from '../logger.js';
import Message from '../models/message.js';

/**
 * Simple Redis-backed per-user message queue utilities.
 * Keys used:
 *  - user:{userId}:queue  (list of JSON-encoded message objects)
 */

export async function enqueueForUser(userId, messageObj) {
  if (!global.redisClient) {
    logger.warn('enqueueForUser: no redis client available; skipping enqueue');
    return false;
  }
  if (!userId || !messageObj) return false;
  try {
    await global.redisClient.rPush(`user:${userId}:queue`, JSON.stringify(messageObj));
    return true;
  } catch (e) {
    logger.warn('enqueueForUser error: ' + (e.message || e));
    return false;
  }
}

/**
 * Drain the queue for a specific user by repeatedly lPop-ing items and calling handler(msgObj)
 * Handler may be async. This will continue until the queue is empty.
 * Returns number of drained messages.
 */
export async function drainQueueForUser(userId, handler) {
  if (!global.redisClient) {
    logger.warn('drainQueueForUser: no redis client available; nothing to drain');
    return 0;
  }
  if (!userId) return 0;

  let count = 0;
  try {
    // lPop returns a string or null
    while (true) {
      const raw = await global.redisClient.lPop(`user:${userId}:queue`);
      if (!raw) break;
      let msgObj = null;
      try {
        msgObj = JSON.parse(raw);
      } catch (e) {
        logger.warn('Failed to parse queued message JSON: ' + (e.message || e));
        continue;
      }

      try {
        // allow handler to process and possibly update DB
        await handler(msgObj);
      } catch (e) {
        logger.warn('Handler error while processing queued message: ' + (e.message || e));
        // On handler failure we continue - message is already popped. If you need stronger guarantees,
        // implement a reliable queue pattern (BRPOP + retry/backoff) or a pending list.
      }
      count += 1;
    }
  } catch (e) {
    logger.warn('drainQueueForUser error: ' + (e.message || e));
  }
  return count;
}

/**
 * Convenience: enqueue the saved Message document (or plain object) for a user
 */
export async function enqueueSavedMessageForUser(userId, savedMessage) {
  const obj = savedMessage.toObject ? savedMessage.toObject() : savedMessage;
  return enqueueForUser(userId, obj);
}

export default { enqueueForUser, drainQueueForUser, enqueueSavedMessageForUser };
