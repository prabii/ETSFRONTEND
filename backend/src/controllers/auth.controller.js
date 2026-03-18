const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logActivity } = require("../utils/logger");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // Include password in query (it's select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    // If role is specified, validate it
    if (role && user.role !== role) {
      return res.status(401).json({ success: false, message: `You are not registered as ${role}.` });
    }

    const token = signToken(user._id);

    // Log successful login
    await logActivity(user._id, "LOGIN", "User", user._id, { email: user.email }, req.ip);

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        employeeId: req.user.employeeId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/auth/logout (stateless JWT - client removes token)
const logout = (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully." });
};

module.exports = { login, getMe, logout };
