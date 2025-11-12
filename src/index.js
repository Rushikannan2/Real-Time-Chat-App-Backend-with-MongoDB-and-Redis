import dotenv from 'dotenv';
import express from 'express';
import logger from './logger.js';
import { connectMongoose } from './config/mongoose.js';
import { createRedisClient } from './config/redis.js';
import routes from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api', routes);

app.use((err, req, res, next) => {
  logger.error(err.stack || err.message || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

async function start() {
  try {
    await connectMongoose();
  } catch (e) {
    logger.error('Mongoose startup error, continuing without DB: ' + (e.message || e));
  }

  try {
    const redisClient = await createRedisClient();
    if (redisClient) global.redisClient = redisClient; // available app-wide as needed
  } catch (e) {
    logger.error('Redis startup error, continuing without Redis: ' + (e.message || e));
  }

  app.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));
}

start();
