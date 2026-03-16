import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { attendanceApi, reportsApi, AttendanceRecord } from "@/lib/api";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [summary, setSummary] = useState({ totalActive: 0, present: 0, late: 0, absent: 0 });
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; present: number; late: number; absent: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ week: string; attendance: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      attendanceApi.getToday(),
      reportsApi.weekly(),
      reportsApi.monthly(),
    ]).then(([today, weekly, monthly]) => {
      setSummary(today.summary);
      setTodayRecords(today.records.filter(r => r.status !== "absent"));

      // Map weekly breakdown to chart format
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const mapped = weekly.report.dailyBreakdown.map((d, i) => ({
        day: days[i] || d.date,
        present: d.present,
        late: d.late,
        absent: d.absent,
      }));
      setWeeklyData(mapped);

      // Calculate monthly attendance %
      const totalActive = weekly.report.totalActive || 1;
      const monthlyMapped = monthly.report.employeeSummary
        .slice(0, 4)
        .map((_, i) => ({
          week: `Week ${i + 1}`,
          attendance: Math.round(
            ((monthly.report.totalRecords / 4) / totalActive) * 100
          ),
        }));
      setMonthlyData(monthlyMapped.length ? monthlyMapped : [
        { week: "Week 1", attendance: monthly.report.attendanceRate },
      ]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: "Total Employees", value: summary.totalActive, icon: Users, color: "bg-primary/10 text-primary" },
    { label: "Present Today", value: summary.present, icon: UserCheck, color: "bg-zy-success/10 text-zy-success" },
    { label: "Absent Today", value: summary.absent, icon: UserX, color: "bg-destructive/10 text-destructive" },
    { label: "Late Employees", value: summary.late, icon: Clock, color: "bg-zy-warning/10 text-zy-warning" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back. Here's today's overview.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-5 zy-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-bold">{loading ? "—" : s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 zy-shadow">
            <h3 className="text-sm font-semibold mb-4">Weekly Attendance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="present" fill="hsl(var(--zy-success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="hsl(var(--zy-warning))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 zy-shadow">
            <h3 className="text-sm font-semibold mb-4">Monthly Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent attendance */}
        <div className="bg-card border border-border rounded-xl zy-shadow overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold">Today's Attendance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Check-in</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : todayRecords.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">No attendance yet today.</td></tr>
                ) : todayRecords.map((r) => (
                  <tr key={r._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{r.employeeName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.checkInTime || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        r.status === "present" ? "bg-zy-success/10 text-zy-success" :
                        r.status === "late" ? "bg-zy-warning/10 text-zy-warning" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
