// Quick test to see what .env values Node.js is reading
import 'dotenv/config';

console.log('=== Environment Variable Test ===');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
console.log('JWT_SECRET first 30:', process.env.JWT_SECRET?.substring(0, 30));
console.log('JWT_SECRET last 30:', process.env.JWT_SECRET?.substring(process.env.JWT_SECRET.length - 30));
console.log('=================================');
