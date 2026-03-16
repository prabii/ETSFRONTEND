const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leave.controller");
const { verifyToken } = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");

// Employee routes
router.post("/apply", verifyToken, leaveController.applyLeave);
router.get("/my-leaves", verifyToken, leaveController.getMyLeaves);

// Admin/HR routes
router.get("/all", verifyToken, roleGuard.requireAdminOrHR, leaveController.getAllLeaves);
router.put("/:leaveId/status", verifyToken, roleGuard.requireAdminOrHR, leaveController.updateLeaveStatus);

module.exports = router;
