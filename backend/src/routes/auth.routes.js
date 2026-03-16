const express = require("express");
const router = express.Router();
const { login, getMe, logout } = require("../controllers/auth.controller");
const { verifyToken } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", login);

// GET /api/auth/me
router.get("/me", verifyToken, getMe);

// POST /api/auth/logout
router.post("/logout", logout);

module.exports = router;
