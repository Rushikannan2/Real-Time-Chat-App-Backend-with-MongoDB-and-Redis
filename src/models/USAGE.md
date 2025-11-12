# Models usage and examples

This file describes common usage patterns for the Mongoose models created under `src/models`.

Models exported:
- `User` — user accounts (indexed by `email`)
- `Message` — chat messages (indexed by `room` + `createdAt`, and `sender`)
- `ChatRoom` — chat rooms (indexed by `participants`)

Examples

- Load models

```js
import { User, Message, ChatRoom } from './src/models/index.js';
```

- Fetch latest messages for a room (fast because of the `room + createdAt` index)

```js
const messages = await Message.find({ room: roomId })
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();
```

- Fetch recent messages by a particular user

```js
const userMessages = await Message.find({ sender: userId })
  .sort({ createdAt: -1 })
  .limit(100)
  .lean();
```

- Mark messages as read for a user in a room (static helper)

```js
await Message.markAsReadForUser({ roomId, userId });
```

This will add the `userId` into `readBy` for unread messages in that room (skips messages from the same user).

- Mark a single message as read (instance helper)

```js
const msg = await Message.findById(msgId);
await msg.markRead(userId);
```

- Get online users in a ChatRoom

```js
// ChatRoom.getOnlineUsers tries Redis first (global.redisClient.sMembers('online_users'))
// Fallback: it queries User.lastSeen within 5 minutes.
const room = await ChatRoom.findById(roomId);
const onlineUserIds = await room.getOnlineUsers();
```

Notes / assumptions
- Redis: `getOnlineUsers` assumes an app-maintained Redis set `online_users` containing user id strings; adapt `redisKey` when your app uses a different convention.
- Indexes are created to speed up common queries (room history, user messages, email lookup).
