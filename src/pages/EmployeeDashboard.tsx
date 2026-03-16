import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth-context";
import { attendanceApi, AttendanceRecord } from "@/lib/api";
import { Clock, AlertCircle, CheckCircle2, XCircle, ScanLine } from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.employeeId) return;
    attendanceApi.getByEmployee(user.employeeId)
      .then((res) => setRecords(res.records))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.employeeId]);

  const present = records.filter((r) => r.status === "present").length;
  const late = records.filter((r) => r.status === "late").length;
  const absent = records.filter((r) => r.status === "absent").length;

  const totalWorked = records.reduce((sum, r) => sum + (r.workedHours || 0), 0);
  const totalShortage = records.reduce((sum, r) => sum + (r.shortageHours || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.name}. Here is your attendance overview.</p>
          </div>
          <button 
            onClick={() => navigate("/employee/scan")}
            className="inline-flex items-center gap-2 px-4 py-2 zy-gradient text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 transition-opacity zy-shadow"
          >
            <ScanLine className="h-4 w-4" />
            Scanner / Logout
          </button>
        </div>

        {/* Summary Stat Cards */}
        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 zy-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-zy-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-zy-success" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">Present Days</div>
              </div>
              <div className="text-3xl font-bold">{present + late}</div>
              <div className="text-xs text-muted-foreground mt-1">({late} late)</div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 zy-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">Absent</div>
              </div>
              <div className="text-3xl font-bold text-destructive">{absent}</div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 zy-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">Worked Hours</div>
              </div>
              <div className="text-3xl font-bold">{totalWorked.toFixed(1)}<span className="text-lg text-muted-foreground font-normal ml-1">hrs</span></div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 zy-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-zy-warning/10 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-zy-warning" />
                </div>
                <div className="text-sm font-medium text-muted-foreground">Total Shortage</div>
              </div>
              <div className="text-3xl font-bold">{totalShortage.toFixed(1)}<span className="text-lg text-muted-foreground font-normal ml-1">hrs</span></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="text-lg font-semibold">Attendance Log</h2>
        </div>

        <div className="bg-card border border-border rounded-xl zy-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Check-in</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Check-out</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Worked / Shortage</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">Loading...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">No records found.</td></tr>
                ) : records.map((r) => (
                  <tr key={r._id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{r.date}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.checkInTime || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.checkOutTime || "—"}</td>
                    <td className="px-5 py-3 text-sm">
                      {r.workedHours ? (
                        <div>
                           <span className="font-medium">{r.workedHours}h</span>
                           {r.shortageHours && r.shortageHours > 0 ? (
                             <span className="text-destructive ml-2">(-{r.shortageHours}h)</span>
                           ) : null}
                        </div>
                      ) : "—"}
                    </td>
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
