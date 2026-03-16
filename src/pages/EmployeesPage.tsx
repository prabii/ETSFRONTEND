import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { employeesApi, Employee } from "@/lib/api";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = { name: "", employeeId: "", phone: "", email: "", department: "", role: "", joiningDate: "", password: "" };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0); // increment to trigger refetch
  const [form, setForm] = useState({ ...EMPTY_FORM });

  // Fetch employees whenever search or refresh changes
  const fetchEmployees = useCallback(() => {
    setLoading(true);
    employeesApi.getAll({ search: search.trim() || undefined })
      .then((res) => {
        setEmployees(res.employees);
        setTotal(res.total);
      })
      .catch((e) => toast.error(e.message || "Failed to load employees"))
      .finally(() => setLoading(false));
  }, [search, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(fetchEmployees, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (emp: Employee) => {
    setForm({
      name: emp.name,
      employeeId: emp.employeeId,
      phone: emp.phone ?? "",
      email: emp.email,
      department: emp.department,
      role: emp.role,
      joiningDate: emp.joiningDate?.split("T")[0] ?? "",
      password: "",
    });
    setEditingId(emp._id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await employeesApi.update(editingId, form);
        toast.success("Employee updated successfully");
      } else {
        await employeesApi.create(form);
        toast.success(`Employee ${form.name} created successfully`);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
      setRefresh((r) => r + 1); // trigger refetch
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (emp: Employee) => {
    const action = emp.status === "active" ? "Deactivate" : "Activate";
    if (!confirm(`${action} ${emp.name}?`)) return;
    try {
      const res = await employeesApi.toggleStatus(emp._id);
      toast.success(res.message);
      setRefresh((r) => r + 1);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handlePermanentDelete = async (emp: Employee) => {
    if (!confirm(`⚠️ Permanently delete "${emp.name}"? This cannot be undone and removes all login access.`)) return;
    try {
      await employeesApi.delete(emp._id);
      toast.success(`${emp.name} permanently deleted`);
      setRefresh((r) => r + 1);
    } catch {
      toast.error("Failed to delete employee");
    }
  };

  const formFields: { key: keyof typeof form; label: string; type?: string; skipOnEdit?: boolean }[] = [
    { key: "name", label: "Full Name" },
    { key: "employeeId", label: "Employee ID" },
    { key: "email", label: "Email", type: "email" },
    { key: "phone", label: "Phone" },
    { key: "department", label: "Department" },
    { key: "role", label: "Job Role" },
    { key: "joiningDate", label: "Joining Date", type: "date" },
    { key: "password", label: "Password", type: "password", skipOnEdit: true },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Employees</h1>
            <p className="text-sm text-muted-foreground">{total} team members</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg zy-gradient text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg zy-shadow space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold">{editingId ? "Edit Employee" : "Add New Employee"}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formFields
                  .filter((f) => !(editingId && f.skipOnEdit))
                  .map(({ key, label, type = "text" }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
                      <input
                        type={type}
                        value={form[key]}
                        onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={key === "password" && editingId ? "Leave blank to keep unchanged" : ""}
                      />
                    </div>
                  ))}
              </div>
              {!editingId && (
                <p className="text-xs text-muted-foreground">
                  Default password is <strong>employee123</strong> if left blank.
                </p>
              )}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg zy-gradient text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Create Employee"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-card border border-border rounded-xl zy-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        Loading employees...
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                      {search ? `No employees found for "${search}".` : "No employees yet. Click Add Employee to get started."}
                    </td>
                  </tr>
                ) : (
                  employees.map((e) => (
                    <tr key={e._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="font-medium">{e.name}</p>
                          <p className="text-xs text-muted-foreground">{e.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{e.employeeId}</td>
                      <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{e.department}</td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          e.status === "active"
                            ? "bg-zy-success/10 text-zy-success"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(e)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(e)}
                            className={`p-2 rounded-lg transition-colors text-xs font-medium ${
                              e.status === "active"
                                ? "hover:bg-zy-warning/10 text-muted-foreground hover:text-zy-warning"
                                : "hover:bg-zy-success/10 text-muted-foreground hover:text-zy-success"
                            }`}
                            title={e.status === "active" ? "Deactivate" : "Activate"}
                          >
                            {e.status === "active" ? "⏸" : "▶"}
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(e)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                            title="Permanently Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
