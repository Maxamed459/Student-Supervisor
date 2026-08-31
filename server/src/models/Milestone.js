import mongoose from 'mongoose';
import attachmentSchema from './shared/attachmentSchema.js';

const { Schema } = mongoose;

const milestoneSchema = new Schema(
  {
    supervisorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 1 },
    attachments: [attachmentSchema],
    dueDate: { type: Date, default: null },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

milestoneSchema.index({ supervisorId: 1, order: 1 });
milestoneSchema.index({ groupId: 1 });

export default mongoose.model('Milestone', milestoneSchema);
