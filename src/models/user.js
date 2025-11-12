import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * User schema
 * - email is indexed and unique for fast lookup
 * - lastSeen helps determine online/offline status as a fallback when Redis isn't available
 */
const UserSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    passwordHash: { type: String },
    avatarUrl: { type: String },
    status: { type: String, default: 'available' },
    lastSeen: { type: Date, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Unique index on email for quick user lookup by email (sparse to allow users without email)
UserSchema.index({ email: 1 }, { unique: true, sparse: true });

/**
 * Mark user as seen (updates lastSeen)
 * This is a small helper that chat infra can call when a user pings the server.
 */
UserSchema.methods.markSeen = function markSeen() {
  this.lastSeen = new Date();
  return this.save();
};

export default mongoose.model('User', UserSchema);
