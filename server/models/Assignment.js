const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supervisor",
      required: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: [
        "active",
        "completed",
        "cancelled",
      ],
      default: "active",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Only one ACTIVE assignment per student; history kept for cancelled/completed
assignmentSchema.index(
  { student: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "active",
    },
  }
);

module.exports = mongoose.model(
  "Assignment",
  assignmentSchema
);
