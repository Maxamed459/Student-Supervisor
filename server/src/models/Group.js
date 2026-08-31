import mongoose from 'mongoose';

const { Schema } = mongoose;

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, default: null, trim: true },
    description: { type: String, default: '' },
    term: { type: String, default: null }, // e.g. academic term/semester label
    // Supervisors assigned to this Group. A Group may have multiple
    // supervisors; every supervisor in the Group can see every
    // milestone / submission in it. The actual membership link for a
    // supervisor is `User.groupId`, mirroring how a student is linked
    // — this list is kept here for fast "who supervises this Group"
    // lookups but the source of truth is the User records' groupId.
    supervisorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

groupSchema.index({ supervisorIds: 1 });

export default mongoose.model('Group', groupSchema);
