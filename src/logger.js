import fs from 'fs';
import path from 'path';
import winston from 'winston';

const { combine, timestamp, printf, colorize } = winston.format;

// ensure logs directory exists
const logsDir = path.resolve(process.cwd(), 'logs');
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch (err) {
  // ignore
}

const myFormat = printf(({ level, message, timestamp }) => `${timestamp} [${level}] ${message}`);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp(), myFormat),
  transports: [
    new winston.transports.Console({ format: combine(colorize(), timestamp(), myFormat) }),
    new winston.transports.File({ filename: path.join(logsDir, 'app.log'), level: 'info' })
  ],
  exitOnError: false
});

export default logger;
