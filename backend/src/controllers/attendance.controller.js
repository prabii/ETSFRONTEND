const AttendanceRecord = require("../models/AttendanceRecord");
const Employee = require("../models/Employee");
const QRToken = require("../models/QRToken");
const OfficeSettings = require("../models/OfficeSettings");
const jwt = require("jsonwebtoken");

// Haversine distance formula (meters)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper: determine attendance status based on time
function getAttendanceStatus(checkInTime, workStartTime, lateAfterMinutes) {
  const [startHour, startMin] = workStartTime.split(":").map(Number);
  const [checkHour, checkMin] = checkInTime.split(":").map(Number);
  const startTotal = startHour * 60 + startMin;
  const checkTotal = checkHour * 60 + checkMin;
  const lateThreshold = startTotal + lateAfterMinutes;
  if (checkTotal <= lateThreshold) return "present";
  return "late";
}

// GET /api/attendance
const getAttendance = async (req, res) => {
  try {
    const { date, department, status, search, page = 1, limit = 100 } = req.query;

    const filter = {};
    if (date) filter.date = date;
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { employeeName: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      AttendanceRecord.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ date: -1, checkInTime: 1 }),
      AttendanceRecord.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/attendance/today
const getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const [records, activeEmployees] = await Promise.all([
      AttendanceRecord.find({ date: today }),
      Employee.countDocuments({ status: "active" }),
    ]);

    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    const absent = activeEmployees - present - late;

    res.status(200).json({
      success: true,
      date: today,
      summary: { totalActive: activeEmployees, present, late, absent },
      records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/attendance/employee/:employeeId
const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { from, to, page = 1, limit = 30 } = req.query;

    // Employees can only see their own records
    if (req.user.role === "employee" && req.user.employeeId !== employeeId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const filter = { employeeId: employeeId.toUpperCase() };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      AttendanceRecord.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ date: -1 }),
      AttendanceRecord.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/attendance/checkin
const checkIn = async (req, res) => {
  try {
    const { qrToken, lat, lng } = req.body;
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: "No employee ID linked to this account." });
    }

    // Extract internal token from JWT
    let internalToken;
    try {
      const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);
      internalToken = decoded.qrToken;
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid or malformed QR code." });
    }

    // Validate QR token in database
    const qr = await QRToken.findOne({ token: internalToken, isActive: true });
    if (!qr) {
      return res.status(400).json({ success: false, message: "Invalid or expired QR code." });
    }
    if (new Date() > qr.expiresAt) {
      return res.status(400).json({ success: false, message: "QR code has expired. Please ask admin to generate a new one." });
    }

    // Get office settings for geofence
    const settings = await OfficeSettings.findOne();
    if (!settings) {
      return res.status(500).json({ success: false, message: "Office settings not configured." });
    }

    // Geofence check
    const distance = Math.round(getDistance(lat, lng, settings.lat, settings.lng));
    if (distance > settings.radius) {
      return res.status(400).json({
        success: false,
        message: `You are not within office premises. Distance: ${distance}m (allowed: ${settings.radius}m)`,
        distance,
      });
    }

    // Get employee record
    const employee = await Employee.findOne({ employeeId: employeeId.toUpperCase() });
    if (!employee || employee.status !== "active") {
      return res.status(400).json({ success: false, message: "Employee not found or inactive." });
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const checkInTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Check if already checked in today
    const existing = await AttendanceRecord.findOne({
      employeeId: employeeId.toUpperCase(),
      date: today,
    });

    if (existing) {
      if (existing.checkOutTime) {
        return res.status(400).json({
          success: false,
          message: `You have already completed your shift today at ${existing.checkOutTime}.`,
        });
      }

      // Perform Check-Out
      const [inH, inM] = existing.checkInTime.split(":").map(Number);
      const [outH, outM] = checkInTime.split(":").map(Number); // Current time is checkOutTime
      
      const diffMins = (outH * 60 + outM) - (inH * 60 + inM);
      const workedHours = +(diffMins / 60).toFixed(2);
      const shortageHours = Math.max(0, +(8 - workedHours).toFixed(2));

      existing.checkOutTime = checkInTime; // checkInTime variable holds current time
      existing.workedHours = workedHours;
      existing.shortageHours = shortageHours;
      await existing.save();

      // Track QR token usage
      qr.usedBy.push({ employee: employee._id, employeeId: employee.employeeId });
      await qr.save();

      return res.status(200).json({
        success: true,
        message: `Successfully checked out! Worked: ${workedHours}h, Shortage: ${shortageHours}h`,
        action: "check-out",
        record: {
          employeeName: existing.employeeName,
          date: existing.date,
          checkInTime: existing.checkInTime,
          checkOutTime: existing.checkOutTime,
          workedHours: existing.workedHours,
          shortageHours: existing.shortageHours,
          distance,
        },
      });
    }

    // Determine present/late for Check-In
    const status = getAttendanceStatus(
      checkInTime,
      settings.workStartTime,
      settings.lateAfterMinutes
    );

    // Create attendance record
    const record = await AttendanceRecord.create({
      employee: employee._id,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      department: employee.department,
      date: today,
      checkInTime,
      status,
      checkInLocation: { lat, lng, distance },
      qrToken,
    });

    // Track QR token usage
    qr.usedBy.push({ employee: employee._id, employeeId: employee.employeeId });
    await qr.save();

    res.status(200).json({
      success: true,
      message: `Attendance marked as ${status}!`,
      action: "check-in",
      record: {
        employeeName: record.employeeName,
        date: record.date,
        checkInTime: record.checkInTime,
        status: record.status,
        distance,
      },
    });
  } catch (error) {
    console.error("checkIn error:", error);
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

// PUT /api/attendance/:id/checkout
const checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date();
    const checkOutTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const record = await AttendanceRecord.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found." });
    }

    // Employees can only checkout their own records
    if (req.user.role === "employee" && req.user.employeeId !== record.employeeId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (record.checkOutTime) {
      return res.status(400).json({ success: false, message: "Already checked out." });
    }

    record.checkOutTime = checkOutTime;
    await record.save();

    res.status(200).json({ success: true, message: "Checked out successfully.", checkOutTime });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getAttendance, getTodayAttendance, getEmployeeAttendance, checkIn, checkOut };
