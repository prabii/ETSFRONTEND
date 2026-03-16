require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 ZenithYuga Attendance Server running on port ${PORT}`);
    console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health\n`);
  });
}).catch((err) => {
  console.error("Failed to connect to DB:", err.message);
  process.exit(1);
});
