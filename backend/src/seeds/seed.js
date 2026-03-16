require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Employee = require("../models/Employee");
const AttendanceRecord = require("../models/AttendanceRecord");
const OfficeSettings = require("../models/OfficeSettings");
const { DEFAULT_OFFICE } = require("../config/constants");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/zenithyuga_attendance";

const sampleEmployees = [
  { employeeId: "ZY001", name: "Arjun Patel",   email: "arjun@zenithyuga.com",   phone: "+91 98765 43210", department: "Engineering", role: "Software Developer", joiningDate: "2024-01-15", status: "active" },
  { employeeId: "ZY002", name: "Priya Sharma",   email: "priya@zenithyuga.com",   phone: "+91 98765 43211", department: "Design",       role: "UI/UX Designer",     joiningDate: "2024-02-01", status: "active" },
  { employeeId: "ZY003", name: "Rahul Verma",    email: "rahul@zenithyuga.com",   phone: "+91 98765 43212", department: "Engineering", role: "Backend Developer",  joiningDate: "2024-03-10", status: "active" },
  { employeeId: "ZY004", name: "Sneha Gupta",    email: "sneha@zenithyuga.com",   phone: "+91 98765 43213", department: "HR",          role: "HR Manager",         joiningDate: "2023-11-20", status: "active" },
  { employeeId: "ZY005", name: "Vikram Singh",   email: "vikram@zenithyuga.com",  phone: "+91 98765 43214", department: "Marketing",   role: "Marketing Lead",     joiningDate: "2024-04-05", status: "active" },
  { employeeId: "ZY006", name: "Ananya Das",     email: "ananya@zenithyuga.com",  phone: "+91 98765 43215", department: "Engineering", role: "Frontend Developer", joiningDate: "2024-05-12", status: "inactive" },
  { employeeId: "ZY007", name: "Karan Mehta",    email: "karan@zenithyuga.com",   phone: "+91 98765 43216", department: "Sales",       role: "Sales Executive",    joiningDate: "2024-06-01", status: "active" },
  { employeeId: "ZY008", name: "Divya Nair",     email: "divya@zenithyuga.com",   phone: "+91 98765 43217", department: "Engineering", role: "QA Engineer",        joiningDate: "2024-01-25", status: "active" },
];

const sampleAttendance = [
  { employeeId: "ZY001", employeeName: "Arjun Patel",  department: "Engineering", date: "2026-03-12", checkInTime: "09:02", checkOutTime: "18:05", status: "present", checkInLocation: { lat: 12.9716, lng: 77.5946, distance: 12 } },
  { employeeId: "ZY002", employeeName: "Priya Sharma",  department: "Design",      date: "2026-03-12", checkInTime: "09:15", checkOutTime: "18:00", status: "present", checkInLocation: { lat: 12.9716, lng: 77.5946, distance: 8 } },
  { employeeId: "ZY003", employeeName: "Rahul Verma",   department: "Engineering", date: "2026-03-12", checkInTime: "09:45", checkOutTime: "18:30", status: "late",    checkInLocation: { lat: 12.9716, lng: 77.5946, distance: 20 } },
  { employeeId: "ZY004", employeeName: "Sneha Gupta",   department: "HR",          date: "2026-03-12", checkInTime: "08:55", checkOutTime: "17:50", status: "present", checkInLocation: { lat: 12.9716, lng: 77.5946, distance: 5 } },
  { employeeId: "ZY005", employeeName: "Vikram Singh",  department: "Marketing",   date: "2026-03-12", checkInTime: "",      checkOutTime: "",      status: "absent",  checkInLocation: {} },
  { employeeId: "ZY007", employeeName: "Karan Mehta",   department: "Sales",       date: "2026-03-12", checkInTime: "09:35", checkOutTime: "18:10", status: "late",    checkInLocation: { lat: 12.9716, lng: 77.5946, distance: 35 } },
  { employeeId: "ZY008", employeeName: "Divya Nair",    department: "Engineering", date: "2026-03-12", checkInTime: "08:50", checkOutTime: "18:00", status: "present", checkInLocation: { lat: 12.9716, lng: 77.5946, distance: 7 } },
  { employeeId: "ZY001", employeeName: "Arjun Patel",  department: "Engineering", date: "2026-03-11", checkInTime: "09:00", checkOutTime: "18:00", status: "present", checkInLocation: { lat: 12.9716, lng: 77.5946, distance: 10 } },
  { employeeId: "ZY002", employeeName: "Priya Sharma",  department: "Design",      date: "2026-03-11", checkInTime: "09:10", checkOutTime: "18:05", status: "present", checkInLocation: { lat: 12.9716, lng: 77.5946, distance: 9 } },
  { employeeId: "ZY003", employeeName: "Rahul Verma",   department: "Engineering", date: "2026-03-11", checkInTime: "09:30", checkOutTime: "18:15", status: "late",    checkInLocation: { lat: 12.9716, lng: 77.5946, distance: 15 } },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear collections
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      AttendanceRecord.deleteMany({}),
      OfficeSettings.deleteMany({}),
    ]);
    console.log("🧹 Cleared existing data");

    // Create admin user
    const admin = await User.create({
      name: "Admin User",
      email: "admin@zenithyuga.com",
      password: "admin123",
      role: "admin",
      employeeId: "ZY000",
    });
    console.log(`👑 Admin created: admin@zenithyuga.com / admin123`);

    // Create employees + their user accounts
    for (const empData of sampleEmployees) {
      const employee = await Employee.create(empData);

      // Create associated user account
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
    console.log(`👥 Created ${sampleEmployees.length} employees (password: employee123)`);

    // Create attendance records
    // Attach employee ObjectIds
    for (const att of sampleAttendance) {
      const emp = await Employee.findOne({ employeeId: att.employeeId });
      if (emp) {
        await AttendanceRecord.create({ ...att, employee: emp._id });
      }
    }
    console.log(`📋 Created ${sampleAttendance.length} attendance records`);

    // Create office settings
    await OfficeSettings.create(DEFAULT_OFFICE);
    console.log("🏢 Office settings initialized");

    console.log("\n✅ Seed completed successfully!");
    console.log("─────────────────────────────────────────");
    console.log("  Admin login:    admin@zenithyuga.com / admin123");
    console.log("  Employee login: arjun@zenithyuga.com / employee123");
    console.log("─────────────────────────────────────────\n");
  } catch (error) {
    console.error("❌ Seed error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
