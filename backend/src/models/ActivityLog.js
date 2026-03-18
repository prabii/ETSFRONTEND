const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. "CREATE_EMPLOYEE", "UPDATE_ATTENDANCE", "SUBMIT_REPORT"
    },
    targetType: {
      type: String,
      required: true,
      // e.g. "Employee", "AttendanceRecord", "WorkReport", "User"
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Any additional context: { oldStatus: 'pending', newStatus: 'approved' }
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
