import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['admin', 'supervisor', 'student'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    // A user (student or supervisor) belongs to at most one Group. Group
    // membership is the ONLY mechanism that links students and supervisors.
    // There is no per-user "supervisor" pointer — every supervisor in a
    // Group sees every student's work, and vice versa.
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    phone: { type: String, default: null },
    avatar: {
      publicId: String,
      secureUrl: String,
    },
    mustChangePassword: { type: Boolean, default: false },
    refreshTokenVersion: { type: Number, default: 0 }, // bump to invalidate all refresh tokens
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ groupId: 1, role: 1 });

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenVersion;
  return obj;
};

export default mongoose.model('User', userSchema);
