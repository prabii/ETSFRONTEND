import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { reportsApi, attendanceApi, employeesApi, AttendanceRecord } from "@/lib/api";
import { FileDown, Table } from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      reportsApi.daily(today),
      attendanceApi.getAll(),
      employeesApi.getAll({ status: "active" }),
    ]).then(([daily, all, emps]) => {
      setAttendanceRate(daily.report.summary.attendanceRate);
      setTotalRecords(all.total);
      setActiveEmployees(emps.total);
      setRecords(all.records);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const headers = "Employee,Date,Check-in,Check-out,Status\n";
    const rows = records.map((r) => `${r.employeeName},${r.date},${r.checkInTime},${r.checkOutTime || ""},${r.status}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${reportType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm text-muted-foreground">Generate and export attendance reports.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              <Table className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg zy-gradient text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <FileDown className="h-4 w-4" /> Export PDF
            </button>
          </div>
        </div>

        {/* Report type selector */}
        <div className="flex rounded-lg bg-muted p-1 max-w-sm">
          {(["daily", "weekly", "monthly"] as const).map((t) => (
            <button key={t} onClick={() => setReportType(t)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize ${reportType === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 zy-shadow">
            <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
            <p className="text-3xl font-bold">{loading ? "—" : `${attendanceRate}%`}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 zy-shadow">
            <p className="text-sm text-muted-foreground mb-1">Total Records</p>
            <p className="text-3xl font-bold">{loading ? "—" : totalRecords}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 zy-shadow">
            <p className="text-sm text-muted-foreground mb-1">Active Employees</p>
            <p className="text-3xl font-bold">{loading ? "—" : activeEmployees}</p>
          </div>
        </div>

        {/* Report table */}
        <div className="bg-card border border-border rounded-xl zy-shadow overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-semibold capitalize">{reportType} Report</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Check-in</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Check-out</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Loading...</td></tr>
                ) : records.map((r) => (
                  <tr key={r._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{r.employeeName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.date}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.checkInTime || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{r.checkOutTime || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${r.status === "present" ? "bg-zy-success/10 text-zy-success" : r.status === "late" ? "bg-zy-warning/10 text-zy-warning" : "bg-destructive/10 text-destructive"}`}>
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
