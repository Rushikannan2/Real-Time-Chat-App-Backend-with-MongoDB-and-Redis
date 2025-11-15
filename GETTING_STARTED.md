# Getting Started - Real-Time Chat App

## Quick Start Guide

### 1. Start the Backend Server

```bash
# From project root
npm start
```

The backend will start on `http://localhost:3000`

**Expected Console Output:**
```
Server listening on port 3000
MongoDB connected successfully
Redis connected successfully
Attached Socket.IO Redis adapter (pub/sub)
```

### 2. Start the Frontend Development Server

```bash
# In a new terminal
cd client
pnpm dev
```

The frontend will start on `http://localhost:5173`

### 3. Access the Application

Open your browser and navigate to: `http://localhost:5173`

---

## Testing the Application

### Create Test Accounts

1. **Sign Up** at `http://localhost:5173/signup`
   - Name: Test User 1
   - Email: test@example.com
   - Password: test123

2. **Open an Incognito Window** and sign up another user:
   - Name: Test User 2
   - Email: test2@example.com  
   - Password: test123

### Create a Chat Room

Currently, you need to create rooms via API:

```bash
# Get auth token from localStorage after login
TOKEN="your-jwt-token-here"

# Create a room
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "General Chat",
    "isPrivate": false,
    "participants": []
  }'
```

Or use the MongoDB database directly to create test rooms.

### Test Real-Time Messaging

1. Both users should see the room in the sidebar
2. Click on the room to open it
3. Send messages from both accounts
4. Messages should appear in real-time without refresh
5. Check typing indicators (currently in development)

---

## Troubleshooting

### Socket Connection Issues

**Problem:** "Invalid or expired token" in console

**Solution:**
1. Make sure backend server is running first
2. Check that JWT_SECRET matches in both .env files
3. Clear browser cache and localStorage
4. Re-login to get a fresh token

**Check logs:**
- Backend: Look for `[Socket.IO Auth] Authenticated socket...`
- Frontend: Look for `[Socket] Connected with ID:...`

### CORS Errors

**Problem:** CORS policy blocking requests

**Solution:**
1. Verify `.env` has: `CORS_ORIGIN=http://localhost:5173`
2. Restart backend server after changing .env
3. Check browser console for specific CORS error

### Rooms Not Loading

**Problem:** Rooms list is empty

**Solution:**
1. Check MongoDB connection in backend logs
2. Create test rooms using the API endpoint
3. Verify user is authenticated (check Network tab)

### Messages Not Appearing

**Problem:** Messages sent but not showing

**Solution:**
1. Check Socket.IO connection status (should show "Connected")
2. Open browser DevTools → Network → WS tab → Check Socket.IO connection
3. Verify both users joined the same room
4. Check backend logs for message processing

---

## Development Tips

### Check Socket Connection Status

```javascript
// In browser console
localStorage.getItem('authToken') // Should show JWT token
```

### Monitor Socket Events

Open DevTools → Network → WS → Click socket.io connection → Messages tab

### Database Queries

```bash
# Connect to MongoDB
mongosh "your-connection-string"

# List all rooms
db.chatrooms.find().pretty()

# List all messages
db.messages.find().pretty()

# List all users
db.users.find({}, { passwordHash: 0 }).pretty()
```

---

## Features Implemented

✅ **Authentication**
- User signup with validation
- User login with JWT tokens
- Protected routes
- Auto-redirect on auth state change

✅ **Real-Time Messaging**
- Socket.IO integration with JWT auth
- Send/receive messages instantly
- Message persistence in MongoDB
- Offline message queue (Redis)

✅ **Chat Interface**
- Room list with last message preview
- Message bubbles with sender info
- Timestamps and delivery status
- Auto-scroll to latest message
- Responsive design with Tailwind CSS

✅ **Presence Tracking**
- Online/offline status per room
- Redis-backed presence with TTL
- Visual indicators in UI

✅ **UI/UX**
- Dark mode design
- Loading states
- Error handling with console logs
- Typing indicators (in progress)

---

## Next Steps / TODOs

### High Priority
- [ ] Add room creation UI (currently API-only)
- [ ] Implement typing indicators display
- [ ] Add message read receipts
- [ ] File attachment support
- [ ] User profile editing

### Medium Priority
- [ ] Search messages
- [ ] Room member management UI
- [ ] Private/direct messaging helper
- [ ] Notification sounds
- [ ] Desktop notifications API

### Low Priority
- [ ] Message editing/deletion
- [ ] Emoji picker
- [ ] GIF support
- [ ] Voice messages
- [ ] Video calls

---

## Project Structure

```
├── src/                    # Backend (Node.js)
│   ├── index.js           # Socket.IO server + Express
│   ├── config/            # DB connections
│   ├── models/            # MongoDB schemas
│   ├── routes/            # REST API endpoints
│   ├── services/          # Business logic
│   └── middleware/        # Auth middleware
│
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── pages/         # Login, Signup, Chat
│   │   ├── components/    # Reusable UI components
│   │   │   ├── chat/      # MessageList, MessageInput, etc
│   │   │   └── common/    # ProtectedRoute
│   │   ├── hooks/         # useSocket custom hook
│   │   ├── services/      # API client (axios)
│   │   ├── store/         # Zustand state management
│   │   └── utils/         # Helper functions
│   └── .env.local         # Frontend environment vars
│
└── .env                   # Backend environment vars
```

---

## Environment Variables

### Backend (`.env`)
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MONGO_URI=mongodb+srv://...
REDIS_HOST=...
REDIS_PORT=...
REDIS_USERNAME=...
REDIS_PASSWORD=...
JWT_SECRET=...
```

### Frontend (`client/.env.local`)
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Rooms
- `GET /api/rooms` - Get all rooms (protected)
- `POST /api/rooms` - Create room (protected)
- `POST /api/rooms/:roomId/users` - Add user to room (protected)

### Messages
- `GET /api/chat/:roomId` - Get room messages (protected)
- `POST /api/chat/:roomId` - Send message via REST (protected)

### Socket.IO Events

**Client → Server:**
- `setup` - Associate socket with userId
- `joinRoom` - Join a chat room
- `leaveRoom` - Leave a chat room
- `sendMessage` - Send message (preferred over REST)
- `typing` - Send typing indicator

**Server → Client:**
- `receiveMessage` - New message received
- `typing` - User typing status
- `error` - Error notification
- `userOnline` / `userOffline` - Presence updates

---

## Console Log Patterns

### Successful Connection
```
[Auth Store] Login successful: test@example.com
[Socket] Connecting to http://localhost:3000
[Socket.IO Auth] Authenticated socket abc123 for user test@example.com
[Socket] Connected with ID: abc123
[Chat Store] Fetched 2 rooms
```

### Authentication Error
```
[Socket] Connection error: Invalid or expired token
[Socket.IO Auth] Invalid or expired token: ...
```

### Message Flow
```
[MessageInput] Sending message: Hello World
[Socket] Sending message to room: 123abc
[Socket.IO] Message saved: 456def from user 789ghi to room 123abc
[Socket] Received message: { _id: '456def', content: 'Hello World', ... }
[Chat Store] Adding message to room: 123abc
```

---

## Support

For issues or questions:
1. Check console logs (both browser and backend)
2. Verify environment variables
3. Ensure MongoDB and Redis are accessible
4. Review this guide's troubleshooting section

Happy chatting! 🚀
