const express = require("express");
const router = express.Router();
const { getSettings, updateSettings } = require("../controllers/settings.controller");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin, requireAdminOrHR } = require("../middleware/roleGuard");

// GET /api/settings  (authenticated users)
router.get("/", verifyToken, getSettings);

// PUT /api/settings  (admin/hr only)
router.put("/", verifyToken, requireAdminOrHR, updateSettings);

module.exports = router;
