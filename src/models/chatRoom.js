import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * ChatRoom schema
 * - participants: array of User refs
 * Indexes: participants for quick lookup of rooms a user is in, lastMessageAt for sorting
 */
const ChatRoomSchema = new Schema(
  {
    name: { type: String, trim: true },
    isPrivate: { type: Boolean, default: false },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    metadata: Schema.Types.Mixed,
    lastMessageAt: { type: Date, index: true },
    slug: { type: String, index: true },
  },
  { timestamps: true }
);

// Index on participants to find rooms by user quickly
ChatRoomSchema.index({ participants: 1 });

/**
 * Return online users in this room. Implementation strategy:
 * - If a Redis client is available at global.redisClient and is a modern redis client,
 *   it will attempt to read an 'online_users' set (containing userId strings). This is a
 *   convention — if your app uses a different key, adapt accordingly.
 * - Fallback: query User.lastSeen for participants within a short threshold (5 minutes).
 */
ChatRoomSchema.methods.getOnlineUsers = async function getOnlineUsers({ redisKey = 'online_users', activeMs = 5 * 60 * 1000 } = {}) {
  const room = this;
  const participants = (room.participants || []).map((p) => p.toString());

  // If no participants, return empty
  if (!participants.length) return [];

  // Try Redis first if available
  try {
    const rc = global.redisClient;
    if (rc && typeof rc.sMembers === 'function') {
      // sMembers returns an array of strings
      const online = await rc.sMembers(redisKey);
      if (Array.isArray(online) && online.length) {
        const set = new Set(online.map(String));
        return participants.filter((p) => set.has(p));
      }
      return [];
    }
  } catch (e) {
    // swallow and fallback
  }

  // Fallback: treat users with lastSeen within activeMs as online
  const User = mongoose.model('User');
  const threshold = new Date(Date.now() - activeMs);
  const users = await User.find({ _id: { $in: participants }, lastSeen: { $gte: threshold } }).select('_id').lean();
  return users.map((u) => u._id.toString());
};

export default mongoose.model('ChatRoom', ChatRoomSchema);
