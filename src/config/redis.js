import { createClient } from 'redis';
import logger from '../logger.js';

export async function createRedisClient() {
//   console.log("Redis URL: " +  process.env.REDIS_HOST)
  const url = process.env.REDIS_HOST || null;
  if (!url) {
    logger.warn('REDIS_URL/REDIS_HOST not set; skipping Redis client creation.');
    return null;
  }

//   const client = createClient({ url, password: process.env.REDIS_PASSWORD || undefined });
  const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: url,
        port: process.env.REDIS_PORT
    }
});

  client.on('error', (err) => logger.error(`Redis Client Error: ${err.message}`));

  await client.connect();
  logger.info('Connected to Redis');
  return client;
}


