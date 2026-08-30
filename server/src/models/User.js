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
    // Students only: the supervisor they are assigned to
    supervisorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Cohort / batch / room the user belongs to
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
userSchema.index({ supervisorId: 1 });
userSchema.index({ groupId: 1 });

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenVersion;
  return obj;
};

export default mongoose.model('User', userSchema);
