const express = require("express");
const router = express.Router();
const { submitReport, getReports, reviewReport } = require("../controllers/workReport.controller");
const { verifyToken } = require("../middleware/auth");
const { requireAdminOrHR } = require("../middleware/roleGuard");

router.use(verifyToken);

// Employee submits, Admin/HR reviews
router.post("/", submitReport); // All roles can submit, but logic limits it to employees
router.get("/", getReports); // Logic filters based on role
router.patch("/:id/review", requireAdminOrHR, reviewReport);

module.exports = router;
