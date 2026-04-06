import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { attendanceApi, AttendanceRecord } from "@/lib/api";
import { Search, Trash2 } from "lucide-react";

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [deptFilter, setDeptFilter] = useState("");
  const [search, setSearch] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const departments = [...new Set(records.map((a) => a.department))];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this attendance record? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await attendanceApi.delete(id);
      setRecords((prev) => prev.filter((r) => r._id !== id));
      setTotal((prev) => prev - 1);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete record.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    attendanceApi.getAll({
      date: dateFilter || undefined,
      department: deptFilter || undefined,
      search: search || undefined,
    })
      .then((res) => { setRecords(res.records); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateFilter, deptFilter, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Attendance Records</h1>
          <p className="text-sm text-muted-foreground">View and filter all attendance records.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." className="pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56" />
          </div>
          <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="self-center text-sm text-muted-foreground">{total} records</span>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl zy-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Check-in</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Check-out</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Location</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">Loading...</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No records found.</td></tr>
                ) : records.map((r) => (
                  <tr key={r._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-medium">{r.employeeName}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.date}</td>
                    <td className="px-5 py-3 text-muted-foreground">{r.checkInTime || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{r.checkOutTime || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                      {r.checkInLocation?.distance != null ? `Office - Verified (${r.checkInLocation.distance}m)` : "—"}
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
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleDelete(r._id)}
                        disabled={deletingId === r._id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        title="Delete record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
