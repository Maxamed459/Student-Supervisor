import mongoose from 'mongoose';

const { Schema } = mongoose;

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    term: { type: String, default: null }, // e.g. academic term/semester label
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model('Group', groupSchema);
