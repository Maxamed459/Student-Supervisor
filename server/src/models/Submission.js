import mongoose from 'mongoose';
import attachmentSchema from './shared/attachmentSchema.js';

const { Schema } = mongoose;

const versionSchema = new Schema(
  {
    versionNumber: { type: Number, required: true },
    files: [attachmentSchema],
    note: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const commentSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const submissionSchema = new Schema(
  {
    milestoneId: { type: Schema.Types.ObjectId, ref: 'Milestone', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'changes_requested'],
      default: 'pending',
    },
    versions: [versionSchema],
    comments: [commentSchema],
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One submission "thread" per (milestone, student) pair; new attempts push a new version
submissionSchema.index({ milestoneId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);
