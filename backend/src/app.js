const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const employeeRoutes = require("./routes/employee.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const qrRoutes = require("./routes/qr.routes");
const reportsRoutes = require("./routes/reports.routes");
const settingsRoutes = require("./routes/settings.routes");
const leaveRoutes = require("./routes/leave.routes");

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:8081",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Length"],
    optionsSuccessStatus: 200,
  })
);

// Handle preflight requests for all routes (Express 5 compatible)
app.options("/{*path}", cors());


// ─── BODY PARSING ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/leaves", leaveRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ZenithYuga Attendance API is running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
