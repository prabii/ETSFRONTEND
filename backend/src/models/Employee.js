const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
      // e.g. ZY001, ZY002
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
      // Job role e.g. "Software Developer" (different from user.role which is admin/employee)
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    avatar: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    leaveBalance: {
      paid: { type: Number, default: 2 },
      sick: { type: Number, default: 0 }
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);
