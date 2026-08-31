import mongoose from 'mongoose';
import attachmentSchema from './shared/attachmentSchema.js';

const { Schema } = mongoose;

const milestoneSchema = new Schema(
  {
    // The supervisor who published the milestone. Attribution only —
    // authorization is now keyed on shared Group membership, not on
    // being the original publisher.
    supervisorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // The Group this milestone belongs to. REQUIRED: a milestone
    // exists in exactly one Group's workspace, visible to all of that
    // Group's members.
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
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
milestoneSchema.index({ groupId: 1, order: 1 });

export default mongoose.model('Milestone', milestoneSchema);
