const express = require("express");
const router = express.Router();
const { getDailyReport, getWeeklyReport, getMonthlyReport } = require("../controllers/reports.controller");
const { verifyToken } = require("../middleware/auth");
const { requireAdminOrHR } = require("../middleware/roleGuard");

// All report routes are admin/hr-only
router.use(verifyToken, requireAdminOrHR);

// GET /api/reports/daily?date=YYYY-MM-DD
router.get("/daily", getDailyReport);

// GET /api/reports/weekly?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/weekly", getWeeklyReport);

// GET /api/reports/monthly?month=3&year=2026
router.get("/monthly", getMonthlyReport);

module.exports = router;
