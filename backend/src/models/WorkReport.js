const mongoose = require("mongoose");

const workReportSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    tasksCompleted: {
      type: String,
      required: [true, "Please describe what you worked on today"],
    },
    hoursWorked: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "flagged"],
      default: "pending",
    },
    managerRemarks: {
      type: String,
      default: "",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkReport", workReportSchema);
