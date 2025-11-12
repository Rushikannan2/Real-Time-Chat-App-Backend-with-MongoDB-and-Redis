import mongoose from 'mongoose';
import logger from '../logger.js';

export async function connectMongoose() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    logger.warn('MONGO_URI not set; skipping mongoose connection.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      // mongoose 6+ uses these by default, but left for clarity
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`);
    throw err;
  }
}
