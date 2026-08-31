const mongoose = require("mongoose");

const supervisorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    specialization: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    maxStudents: {
      type: Number,
      default: 10,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Supervisor",
  supervisorSchema
);