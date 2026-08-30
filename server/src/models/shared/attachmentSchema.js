import mongoose from 'mongoose';

const { Schema } = mongoose;

// Reusable embedded schema representing a Cloudinary-hosted asset
const attachmentSchema = new Schema(
  {
    originalFilename: { type: String, required: true },
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    format: String,
    resourceType: { type: String, default: 'raw' }, // image | raw | video | auto
    bytes: Number,
  },
  { _id: false }
);

export default attachmentSchema;
