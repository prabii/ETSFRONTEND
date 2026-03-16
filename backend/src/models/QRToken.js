const mongoose = require("mongoose");

const qrTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      // Format: ZY-ATT-<timestamp>-<random> (matches frontend pattern)
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // TTL index will auto-delete expired tokens from DB
    },
    isActive: {
      type: Boolean,
      default: true,
      // Admin can manually deactivate a token
    },
    usedBy: [
      {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
        employeeId: String,
        usedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Auto-delete expired tokens (MongoDB TTL index)
qrTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("QRToken", qrTokenSchema);
