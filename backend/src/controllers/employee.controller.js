const Employee = require("../models/Employee");
const User = require("../models/User");
const { logActivity } = require("../utils/logger");

// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const { search, department, status, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [employees, total] = await Promise.all([
      Employee.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      employees,
    });
  } catch (error) {
    console.error("getEmployees error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/employees/:id
const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    res.status(200).json({ success: true, employee });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/employees
const createEmployee = async (req, res) => {
  try {
    const { name, employeeId, email, phone, department, role, joiningDate, status, password } = req.body;

    // Check if employeeId or email already exists
    const existing = await Employee.findOne({ $or: [{ employeeId }, { email }] });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.employeeId === employeeId
          ? "Employee ID already exists."
          : "Email already registered.",
      });
    }

    // Create the employee profile
    const employee = await Employee.create({
      employeeId,
      name,
      email,
      phone,
      department,
      role,
      joiningDate,
      status: status || "active",
    });

    // Create a linked user account for login
    const userPassword = password || "employee123"; // default password
    const user = await User.create({
      name,
      email,
      password: userPassword,
      role: "employee",
      employeeId,
    });

    // Link user to employee
    employee.userId = user._id;
    await employee.save();

    // Log activity
    await logActivity(req.user.id, "CREATE_EMPLOYEE", "Employee", employee._id, { name: employee.name, employeeId: employee.employeeId });

    res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      employee,
    });
  } catch (error) {
    console.error("createEmployee error:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const { name, phone, department, role, joiningDate, status, email } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, phone, department, role, joiningDate, status, email },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // Sync name/email on user account too
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { name, email });
    }

    // Log activity
    await logActivity(req.user.id, "UPDATE_EMPLOYEE", "Employee", employee._id, { name: employee.name });

    res.status(200).json({ success: true, message: "Employee updated.", employee });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// PATCH /api/employees/:id/status  (toggle active <-> inactive)
const toggleStatus = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const newStatus = employee.status === "active" ? "inactive" : "active";
    employee.status = newStatus;
    await employee.save();

    // Sync user account isActive
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { isActive: newStatus === "active" });
    }

    // Log activity
    await logActivity(req.user.id, "TOGGLE_EMPLOYEE_STATUS", "Employee", employee._id, { status: newStatus });

    res.status(200).json({
      success: true,
      message: `Employee ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
      employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// DELETE /api/employees/:id  (permanent delete)
const permanentDelete = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // Also remove linked user account
    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId);
    }

    // Log activity
    await logActivity(req.user.id, "DELETE_EMPLOYEE", "Employee", employee._id, { name: employee.name, employeeId: employee.employeeId });

    res.status(200).json({ success: true, message: "Employee permanently deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, toggleStatus, permanentDelete };
