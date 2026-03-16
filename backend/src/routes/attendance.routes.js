const express = require("express");
const router = express.Router();
const {
  getAttendance,
  getTodayAttendance,
  getEmployeeAttendance,
  checkIn,
  checkOut,
} = require("../controllers/attendance.controller");
const { verifyToken } = require("../middleware/auth");
const { requireAdminOrHR, requireEmployee } = require("../middleware/roleGuard");

// GET /api/attendance  (admin/hr)
router.get("/", verifyToken, requireAdminOrHR, getAttendance);

// GET /api/attendance/today  (admin/hr)
router.get("/today", verifyToken, requireAdminOrHR, getTodayAttendance);

// GET /api/attendance/employee/:employeeId  (employee sees own, admin sees all)
router.get("/employee/:employeeId", verifyToken, requireEmployee, getEmployeeAttendance);

// POST /api/attendance/checkin  (employee)
router.post("/checkin", verifyToken, requireEmployee, checkIn);

// PUT /api/attendance/:id/checkout  (employee)
router.put("/:id/checkout", verifyToken, requireEmployee, checkOut);

module.exports = router;
