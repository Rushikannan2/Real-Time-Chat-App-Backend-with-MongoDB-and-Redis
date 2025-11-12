# BDE Chat Backend (initial scaffold)

This repository is a starter scaffold for a real-time chat backend using Node.js, Express, MongoDB, and Redis. It uses ES modules and Winston for logging.

Quick start

1. Copy `.env.example` to `.env` and fill in your values.
2. Install dependencies:

   npm install

3. Start in development (requires nodemon):

   npm run dev

4. Start production:

   npm start

What was added

- `package.json` (ES modules, scripts, deps)
- `src/index.js` - Express server entry
- `src/config/mongoose.js` - Mongoose connection helper
- `src/config/redis.js` - Redis client helper
- `src/logger.js` - Winston logger setup
- `src/routes/*` - Basic routes including health and chat message placeholder
- `.env.example`, `.gitignore`, `README.md`

Notes

- Config files skip connecting if corresponding environment variables are not set (safe for local dev).
- This is an initial scaffold: you can extend routes to save messages, add authentication, and integrate socket.io or other real-time transports.
