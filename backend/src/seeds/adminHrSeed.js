require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Employee = require("../models/Employee");
const OfficeSettings = require("../models/OfficeSettings");
const { DEFAULT_OFFICE } = require("../config/constants");

const MONGO_URI = process.env.MONGO_URI;

const sampleEmployees = [
  { employeeId: "ZY001", name: "Arjun Patel",   email: "arjun@zenithyuga.com",   phone: "+91 98765 43210", department: "Engineering", role: "Software Developer", joiningDate: "2024-01-15", status: "active" },
  { employeeId: "ZY002", name: "Priya Sharma",   email: "priya@zenithyuga.com",   phone: "+91 98765 43211", department: "Design",       role: "UI/UX Designer",     joiningDate: "2024-02-01", status: "active" },
  { employeeId: "ZY003", name: "Rahul Verma",    email: "rahul@zenithyuga.com",   phone: "+91 98765 43212", department: "Engineering", role: "Backend Developer",  joiningDate: "2024-03-10", status: "active" },
  { employeeId: "ZY004", name: "Sneha Gupta",    email: "sneha@zenithyuga.com",   phone: "+91 98765 43213", department: "HR",          role: "HR Manager",         joiningDate: "2023-11-20", status: "active" },
  { employeeId: "ZY005", name: "Vikram Singh",   email: "vikram@zenithyuga.com",  phone: "+91 98765 43214", department: "Marketing",   role: "Marketing Lead",     joiningDate: "2024-04-05", status: "active" },
];

async function seed() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    console.log("⏳ Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    // Clear existing users and employees to prevent duplicates during seeding
    await User.deleteMany({});
    await Employee.deleteMany({});
    console.log("🧹 Cleared existing Users and Employees");

    // 1. Create Admin User
    const admin = await User.create({
      name: "Admin User",
      email: "admin@zenithyuga.com",
      password: "admin123",
      role: "admin",
      employeeId: "ZY000",
    });
    console.log("👑 Admin created: admin@zenithyuga.com / admin123");

    // 2. Create HR User
    const hrUser = await User.create({
      name: "HR Manager",
      email: "hr@zenithyuga.com",
      password: "hrlogin123",
      role: "hr",
      employeeId: "ZYHR01",
    });
    console.log("👤 HR User created: hr@zenithyuga.com / hrlogin123");

    // 3. Create Employees + their User accounts
    for (const empData of sampleEmployees) {
      const employee = await Employee.create(empData);

      const user = await User.create({
        name: empData.name,
        email: empData.email,
        password: "employee123",
        role: "employee",
        employeeId: empData.employeeId,
        isActive: empData.status === "active",
      });

      employee.userId = user._id;
      await employee.save();
    }
    console.log(`👥 Created ${sampleEmployees.length} test employees (password: employee123)`);

    // 4. Initialize Office Settings if not present
    const existingSettings = await OfficeSettings.findOne();
    if (!existingSettings) {
      await OfficeSettings.create(DEFAULT_OFFICE);
      console.log("🏢 Office settings initialized");
    }

    console.log("\n✅ All set! Your database is now ready with Admin, HR, and test employees.");
    console.log("─────────────────────────────────────────");
    console.log("  Admin login: admin@zenithyuga.com / admin123");
    console.log("  HR login:    hr@zenithyuga.com / hr123");
    console.log("  Employee:    arjun@zenithyuga.com / employee123");
    console.log("─────────────────────────────────────────\n");

  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
