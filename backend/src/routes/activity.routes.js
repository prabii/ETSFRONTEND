const express = require("express");
const router = express.Router();
const { getActivityLogs } = require("../controllers/activity.controller");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleGuard");

// Only Admin can see activity logs
router.get("/", verifyToken, requireAdmin, getActivityLogs);

module.exports = router;
