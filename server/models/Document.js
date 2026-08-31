const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Document category (thesis, proposal, etc.) — also exposed as documentType
    type: {
      type: String,
      enum: ["thesis", "project_book", "proposal", "report", "other"],
      required: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    originalName: {
      type: String,
      required: true,
    },

    // Cloudinary delivery URL (secure_url)
    fileUrl: {
      type: String,
      required: true,
    },

    // Cloudinary public_id used for delete/replace
    publicId: {
      type: String,
      required: true,
    },

    // MIME type (e.g. application/pdf)
    fileType: {
      type: String,
      default: "",
    },

    mimeType: {
      type: String,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    // Cloudinary resource_type: image | raw | video
    resourceType: {
      type: String,
      default: "raw",
    },

    // Student who uploaded
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending_review",
        "approved",
        "rejected",
        "changes_requested",
      ],
      default: "pending_review",
    },

    feedback: {
      type: String,
      trim: true,
      default: "",
    },

    // Supervisor who reviewed
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Aliases matching the Cloudinary metadata contract
documentSchema.virtual("documentType").get(function documentType() {
  return this.type;
});

documentSchema.virtual("student").get(function student() {
  return this.uploadedBy;
});

documentSchema.virtual("supervisor").get(function supervisor() {
  return this.reviewedBy;
});

documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ status: 1, createdAt: -1 });
documentSchema.index({ group: 1 });
documentSchema.index({ publicId: 1 });

module.exports = mongoose.model("Document", documentSchema);
