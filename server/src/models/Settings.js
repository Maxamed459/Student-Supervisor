import mongoose from 'mongoose';

const { Schema } = mongoose;

// Singleton document holding global platform settings (FR-A7)
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    academicTerms: [{ type: String }],
    submissionCategories: [{ type: String }], // e.g. Chapter 1, Chapter 2, Proposal...
    chapterTemplates: [
      {
        title: String,
        description: String,
      },
    ],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
