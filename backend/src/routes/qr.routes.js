const express = require("express");
const router = express.Router();
const { generateQR, validateQR, getActiveToken } = require("../controllers/qr.controller");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin, requireAdminOrHR } = require("../middleware/roleGuard");

// GET /api/qr/generate  (admin/hr only)
router.get("/generate", verifyToken, requireAdminOrHR, generateQR);

// GET /api/qr/active  (get current valid token, used by scanners and admin)
router.get("/active", getActiveToken);

// POST /api/qr/validate  (public - for employee scanner)
router.post("/validate", validateQR);

module.exports = router;
