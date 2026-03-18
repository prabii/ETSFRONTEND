const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const { logActivity } = require("../utils/logger");

// Apply for a leave (Employee)
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    
    // The user's object ID is attached from verifyToken
    const userId = req.user.id;
    
    // Find the employee record linked to the user
    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }

    // Calculate days requested (inclusive). Assuming valid date strings.
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance for paid and sick leaves
    if (leaveType !== "unpaid") {
      const balance = employee.leaveBalance[leaveType] || 0;
      if (requestedDays > balance) {
        return res.status(400).json({ 
          success: false, 
          message: `Insufficient ${leaveType} leave balance. You have ${balance} days left, but requested ${requestedDays} days.` 
        });
      }
    }

    const leave = new Leave({
      employeeId: employee._id,
      leaveType,
      startDate,
      endDate,
      reason
    });

    await leave.save();

    // Log activity
    await logActivity(userId, "SUBMIT_LEAVE_APPLICATION", "Leave", leave._id, { leaveType, days: requestedDays });

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully.",
      data: leave
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Error applying for leave.", error: error.message });
  }
};

// Get leaves for the logged in employee
exports.getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const employee = await Employee.findOne({ userId });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }

    const leaves = await Leave.find({ employeeId: employee._id }).sort({ appliedOn: -1 });
    
    res.status(200).json({
      success: true,
      data: leaves,
      balance: employee.leaveBalance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching leaves.", error: error.message });
  }
};

// Get all leaves (Admin/HR)
exports.getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("employeeId", "name employeeId department avatar")
      .sort({ appliedOn: -1 });
      
    res.status(200).json({
      success: true,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching all leaves.", error: error.message });
  }
};

// Update leave status (Admin/HR) -> Approving / Rejecting
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, adminComment } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status update." });
    }

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave record not found." });
    }

    // Check if it's already processed to prevent double deduction
    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, message: "Leave has already been processed." });
    }

    if (status === "approved" && leave.leaveType !== "unpaid") {
      const employee = await Employee.findById(leave.employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: "Employee not found." });
      }

      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const diffTime = Math.abs(end - start);
      const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Deduct from balance
      if (employee.leaveBalance[leave.leaveType] < requestedDays) {
         return res.status(400).json({ success: false, message: "Insufficient leave balance for approval." });
      }

      employee.leaveBalance[leave.leaveType] -= requestedDays;
      await employee.save();
    }

    leave.status = status;
    if (adminComment) {
      leave.adminComment = adminComment;
    }
    
    await leave.save();

    // Log activity
    await logActivity(req.user.id, "UPDATE_LEAVE_STATUS", "Leave", leave._id, { status });

    res.status(200).json({
      success: true,
      message: `Leave successfully ${status}.`,
      data: leave
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating leave status.", error: error.message });
  }
};
