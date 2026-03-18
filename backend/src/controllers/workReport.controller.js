const WorkReport = require("../models/WorkReport");
const Employee = require("../models/Employee");
const { logActivity } = require("../utils/logger");

// Submit a work report (Employee only)
exports.submitReport = async (req, res) => {
  try {
    const { tasksCompleted, hoursWorked, date } = req.body;
    
    // Find employee associated with current user
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    const report = await WorkReport.create({
      employee: employee._id,
      tasksCompleted,
      hoursWorked,
      date: date || new Date(),
    });

    // Log the activity
    await logActivity(req.user.id, "SUBMIT_WORK_REPORT", "WorkReport", report._id, { date: report.date });

    res.status(201).json({ message: "Work report submitted successfully", report });
  } catch (error) {
    res.status(500).json({ message: "Error submitting work report", error: error.message });
  }
};

// Get work reports (Admin/HR see all, Employees see own)
exports.getReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, employeeId } = req.query;
    
    const query = {};
    if (req.user.role === "employee") {
      const employee = await Employee.findOne({ userId: req.user.id });
      query.employee = employee._id;
    } else {
      // Admin/HR can filter by employee
      if (employeeId) query.employee = employeeId;
    }

    if (status) query.status = status;

    const reports = await WorkReport.find(query)
      .populate("employee", "name employeeId department")
      .populate("reviewedBy", "name")
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await WorkReport.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalReports: count,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching work reports", error: error.message });
  }
};

// Review/Update work report (Admin/HR only)
exports.reviewReport = async (req, res) => {
  try {
    const { status, managerRemarks } = req.body;
    const { id } = req.params;

    const report = await WorkReport.findByIdAndUpdate(
      id,
      { 
        status, 
        managerRemarks, 
        reviewedBy: req.user.id 
      },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Work report not found" });
    }

    // Log the activity
    await logActivity(req.user.id, "REVIEW_WORK_REPORT", "WorkReport", report._id, { status });

    res.json({ message: "Work report reviewed successfully", report });
  } catch (error) {
    res.status(500).json({ message: "Error reviewing work report", error: error.message });
  }
};
