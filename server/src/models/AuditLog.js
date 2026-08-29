import mongoose from 'mongoose';

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true }, // e.g. 'user.create', 'submission.approve'
    entityType: { type: String, required: true }, // 'User' | 'Group' | 'Milestone' | 'Submission' | ...
    entityId: { type: Schema.Types.ObjectId, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
// Text index to support the searchable activity log requirement (FR-C3)
auditLogSchema.index({ action: 'text', entityType: 'text' });

export default mongoose.model('AuditLog', auditLogSchema);
