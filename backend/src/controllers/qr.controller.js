const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const QRToken = require("../models/QRToken");

// GET /api/qr/generate  (admin only)
const generateQR = async (req, res) => {
  try {
    const internalToken = `ZY-ATT-${Date.now()}-${uuidv4().split("-")[0]}`;
    // Set expiry to 10 years from now to make it effectively constant
    const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);

    // Deactivate any previous active tokens
    await QRToken.updateMany({ isActive: true }, { isActive: false });

    // Store the internal UUID token in DB
    const qrToken = await QRToken.create({
      token: internalToken,
      generatedBy: req.user._id,
      expiresAt,
      isActive: true,
    });

    // Create JWT containing the internal token
    const signedToken = jwt.sign(
      { qrToken: internalToken },
      process.env.JWT_SECRET,
      { expiresIn: "3650d" } // 10 years
    );

    res.status(201).json({
      success: true,
      message: "QR token generated.",
      qrToken: {
        token: signedToken, // Give JWT to frontend
        expiresAt: qrToken.expiresAt,
        expiresInMinutes: 5256000, // 10 years
        generatedAt: qrToken.createdAt,
      },
    });
  } catch (error) {
    console.error("generateQR error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// POST /api/qr/validate  (public - used before checkin)
const validateQR = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid or malformed QR token format." });
    }

    const internalToken = decoded.qrToken;
    const qr = await QRToken.findOne({ token: internalToken });
    if (!qr) {
      return res.status(404).json({ success: false, valid: false, message: "Invalid QR code." });
    }

    if (!qr.isActive) {
      return res.status(400).json({ success: false, valid: false, message: "QR code has been deactivated." });
    }

    // Expiration check removed intentionally as QR code runs constantly until regenerated

    res.status(200).json({
      success: true,
      valid: true,
      message: "QR code is valid.",
      expiresAt: qr.expiresAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/qr/active  (admin - get current active token)
const getActiveToken = async (req, res) => {
  try {
    const qr = await QRToken.findOne({ isActive: true, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 });

    if (!qr) {
      return res.status(404).json({ success: false, message: "No active QR token found." });
    }

    // Sign JWT for the active token to return to frontend simulator
    const signedToken = jwt.sign(
      { qrToken: qr.token },
      process.env.JWT_SECRET,
      { expiresIn: "3650d" }
    );

    res.status(200).json({
      success: true,
      qrToken: {
        token: signedToken,
        expiresAt: qr.expiresAt,
        usageCount: qr.usedBy.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { generateQR, validateQR, getActiveToken };
