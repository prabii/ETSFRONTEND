const AttendanceRecord = require("../models/AttendanceRecord");
const Employee = require("../models/Employee");

// GET /api/reports/daily?date=YYYY-MM-DD
const getDailyReport = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const date = req.query.date || today;

    const [records, activeEmployees] = await Promise.all([
      AttendanceRecord.find({ date }).sort({ department: 1, employeeName: 1 }),
      Employee.countDocuments({ status: "active" }),
    ]);

    const present = records.filter((r) => r.status === "present").length;
    const late = records.filter((r) => r.status === "late").length;
    const absent = activeEmployees - present - late;
    const attendanceRate = activeEmployees > 0
      ? Math.round(((present + late) / activeEmployees) * 100)
      : 0;

    res.status(200).json({
      success: true,
      report: {
        type: "daily",
        date,
        summary: { totalActive: activeEmployees, present, late, absent, attendanceRate },
        records,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/reports/weekly?from=YYYY-MM-DD&to=YYYY-MM-DD
const getWeeklyReport = async (req, res) => {
  try {
    // Default: past 7 days
    const to = req.query.to || new Date().toISOString().split("T")[0];
    const fromDate = new Date(to);
    fromDate.setDate(fromDate.getDate() - 6);
    const from = req.query.from || fromDate.toISOString().split("T")[0];

    const [records, activeEmployees] = await Promise.all([
      AttendanceRecord.find({ date: { $gte: from, $lte: to } }).sort({ date: 1 }),
      Employee.countDocuments({ status: "active" }),
    ]);

    // Group by day
    const byDay = {};
    records.forEach((r) => {
      if (!byDay[r.date]) {
        byDay[r.date] = { date: r.date, present: 0, late: 0, absent: 0 };
      }
      if (r.status === "present") byDay[r.date].present++;
      else if (r.status === "late") byDay[r.date].late++;
    });

    // Fill in absent for each day
    const dailyBreakdown = Object.values(byDay).map((day) => ({
      ...day,
      absent: activeEmployees - day.present - day.late,
    }));

    res.status(200).json({
      success: true,
      report: {
        type: "weekly",
        from,
        to,
        totalActive: activeEmployees,
        dailyBreakdown,
        totalRecords: records.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// GET /api/reports/monthly?month=3&year=2026
const getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const paddedMonth = String(month).padStart(2, "0");
    const from = `${year}-${paddedMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const to = `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`;

    const [records, activeEmployees] = await Promise.all([
      AttendanceRecord.find({ date: { $gte: from, $lte: to } }),
      Employee.countDocuments({ status: "active" }),
    ]);

    // Per-employee summary
    const employeeMap = {};
    records.forEach((r) => {
      if (!employeeMap[r.employeeId]) {
        employeeMap[r.employeeId] = {
          employeeId: r.employeeId,
          employeeName: r.employeeName,
          department: r.department,
          present: 0,
          late: 0,
          absent: 0,
          totalDays: 0,
        };
      }
      employeeMap[r.employeeId].totalDays++;
      if (r.status === "present") employeeMap[r.employeeId].present++;
      else if (r.status === "late") employeeMap[r.employeeId].late++;
      else employeeMap[r.employeeId].absent++;
    });

    const totalPresent = records.filter((r) => r.status === "present").length;
    const totalLate = records.filter((r) => r.status === "late").length;
    const workdays = lastDay; // simplified
    const attendanceRate = workdays > 0 && activeEmployees > 0
      ? Math.round(((totalPresent + totalLate) / (workdays * activeEmployees)) * 100)
      : 0;

    res.status(200).json({
      success: true,
      report: {
        type: "monthly",
        month,
        year,
        from,
        to,
        totalActive: activeEmployees,
        attendanceRate,
        totalRecords: records.length,
        employeeSummary: Object.values(employeeMap),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { getDailyReport, getWeeklyReport, getMonthlyReport };
