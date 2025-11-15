import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Message schema
 * - room: reference to ChatRoom
 * - sender: reference to User
 * - readBy: array of user _id's who have read the message
 * Indexes: room+createdAt for efficient room history queries, sender for user queries
 */
const MessageSchema = new Schema(
  {
    room: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, trim: true },
    attachments: [
      {
        url: String,
        mime: String,
        meta: Schema.Types.Mixed,
      },
    ],
    // Users who have read this message
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
  // Users who have been delivered this message (but may not have read it yet)
  deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Compound index for fetching room messages in reverse chronological order
MessageSchema.index({ room: 1, createdAt: -1 });
// Index to quickly find messages by sender (useful for moderation / user query)
MessageSchema.index({ sender: 1, createdAt: -1 });

/**
 * Instance method to mark this message as read by a user
 */
MessageSchema.methods.markRead = function markRead(userId) {
  const uid = userId && userId.toString ? userId.toString() : String(userId);
  // Avoid duplicates
  const already = (this.readBy || []).some((r) => r.toString() === uid);
  if (already) return Promise.resolve(this);
  this.readBy = this.readBy || [];
  this.readBy.push(uid);
  return this.save();
};

/**
 * Instance method to mark this message as delivered to a user
 */
MessageSchema.methods.markDelivered = function markDelivered(userId) {
  const uid = userId && userId.toString ? userId.toString() : String(userId);
  const already = (this.deliveredTo || []).some((r) => r.toString() === uid);
  if (already) return Promise.resolve(this);
  this.deliveredTo = this.deliveredTo || [];
  this.deliveredTo.push(uid);
  return this.save();
};

/**
 * Static to mark all unread messages in a room as read by a user.
 * Options:
 *  - roomId: ObjectId (required)
 *  - userId: ObjectId (required)
 *  - upTo: optional message id — only mark messages with createdAt <= that message's createdAt
 */
MessageSchema.statics.markAsReadForUser = async function ({ roomId, userId, upTo }) {
  if (!roomId || !userId) throw new Error('roomId and userId are required');

  const filter = {
    room: roomId,
    sender: { $ne: userId },
    readBy: { $ne: userId },
  };

  if (upTo) {
    // If provided an objectId, try to resolve createdAt bound
    const upToDoc = await this.findById(upTo).select('createdAt').lean();
    if (upToDoc && upToDoc.createdAt) filter.createdAt = { $lte: upToDoc.createdAt };
  }

  const res = await this.updateMany(filter, { $addToSet: { readBy: userId } });
  return res;
};

export default mongoose.model('Message', MessageSchema);
