// Entry point that loads environment variables FIRST
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('[Server] Environment loaded:');
console.log('[Server] JWT_SECRET length:', process.env.JWT_SECRET?.length || 'undefined');
console.log('[Server] MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');

// Now import and run the main application
import './index.js';
