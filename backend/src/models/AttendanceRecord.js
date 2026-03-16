const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // Denormalized fields for fast queries without population
    employeeId: {
      type: String,
      required: true,
      uppercase: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      // Format: YYYY-MM-DD
    },
    checkInTime: {
      type: String,
      default: "",
      // Format: HH:MM (24h)
    },
    checkOutTime: {
      type: String,
      default: "",
    },
    checkInLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      distance: { type: Number, default: null }, // meters from office
    },
    status: {
      type: String,
      enum: ["present", "late", "absent"],
      default: "absent",
    },
    workedHours: {
      type: Number,
      default: 0,
    },
    shortageHours: {
      type: Number,
      default: 0,
    },
    qrToken: {
      type: String,
      default: null,
      // The QR token value used to mark attendance
    },
  },
  { timestamps: true }
);

// Compound index: one record per employee per day
attendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Index for fast date-based queries
attendanceRecordSchema.index({ date: 1 });
attendanceRecordSchema.index({ department: 1 });

module.exports = mongoose.model("AttendanceRecord", attendanceRecordSchema);
