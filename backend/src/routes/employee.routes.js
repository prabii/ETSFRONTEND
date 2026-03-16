const express = require("express");
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  toggleStatus,
  permanentDelete,
} = require("../controllers/employee.controller");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin, requireAdminOrHR } = require("../middleware/roleGuard");

// All employee routes require admin or hr
router.use(verifyToken, requireAdminOrHR);

// GET /api/employees
router.get("/", getEmployees);

// GET /api/employees/:id
router.get("/:id", getEmployee);

// POST /api/employees
router.post("/", createEmployee);

// PUT /api/employees/:id
router.put("/:id", updateEmployee);

// PATCH /api/employees/:id/status  (toggle active <-> inactive)
router.patch("/:id/status", toggleStatus);

// DELETE /api/employees/:id  (permanent delete)
router.delete("/:id", permanentDelete);

module.exports = router;
