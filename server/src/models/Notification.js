import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'assignment',
        'guideline_published',
        'task_created',
        'submission_received',
        'review_outcome',
        'account_created',
      ],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String, default: null },
    emailSent: { type: Boolean, default: false },
    emailError: { type: String, default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
