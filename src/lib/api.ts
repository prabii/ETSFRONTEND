const BASE_URL = "/api";

function getToken(): string | null {
  return localStorage.getItem("zy_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "API error");
  }
  return data as T;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string, role: string) =>
    request<{ success: boolean; token: string; user: { id: string; name: string; email: string; role: string; employeeId: string } }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password, role }) }
    ),
  me: () => request<{ user: { id: string; name: string; email: string; role: string; employeeId: string } }>("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
};

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
export const employeesApi = {
  getAll: (params?: { search?: string; department?: string; status?: string }) => {
    const clean = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
    const qs = new URLSearchParams(clean).toString();
    return request<{ success: boolean; total: number; employees: Employee[] }>(`/employees${qs ? `?${qs}` : ""}`);
  },
  getOne: (id: string) => request<{ employee: Employee }>(`/employees/${id}`),
  create: (data: Partial<Employee> & { password?: string }) =>
    request<{ employee: Employee }>("/employees", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Employee>) =>
    request<{ employee: Employee }>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleStatus: (id: string) =>
    request<{ employee: Employee; message: string }>(`/employees/${id}/status`, { method: "PATCH" }),
  delete: (id: string) => request(`/employees/${id}`, { method: "DELETE" }),
};

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
export const attendanceApi = {
  getAll: (params?: { date?: string; department?: string; status?: string; search?: string }) => {
    const clean = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
    const qs = new URLSearchParams(clean).toString();
    return request<{ success: boolean; total: number; records: AttendanceRecord[] }>(`/attendance${qs ? `?${qs}` : ""}`);
  },
  getToday: () =>
    request<{ date: string; summary: { totalActive: number; present: number; late: number; absent: number }; records: AttendanceRecord[] }>("/attendance/today"),
  getByEmployee: (employeeId: string) =>
    request<{ records: AttendanceRecord[] }>(`/attendance/employee/${employeeId}`),
  checkIn: (data: { qrToken: string; lat: number; lng: number }) =>
    request<{
      success: boolean;
      message: string;
      action: "check-in" | "check-out";
      record: {
        employeeName: string;
        date: string;
        checkInTime: string;
        checkOutTime?: string;
        workedHours?: number;
        shortageHours?: number;
        status?: string;
        distance?: number;
      };
    }>("/attendance/checkin", { method: "POST", body: JSON.stringify(data) }),
  checkOut: (id: string) =>
    request(`/attendance/${id}/checkout`, { method: "PUT" }),
};

// ─── QR ───────────────────────────────────────────────────────────────────────
export const qrApi = {
  generate: () =>
    request<{ qrToken: { token: string; expiresAt: string; expiresInMinutes: number; generatedAt: string } }>("/qr/generate"),
  getActive: () =>
    request<{ qrToken: { token: string; expiresAt: string; usageCount: number } }>("/qr/active"),
  validate: (token: string) =>
    request<{ valid: boolean; expiresAt: string }>("/qr/validate", { method: "POST", body: JSON.stringify({ token }) }),
};

// ─── REPORTS ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  daily: (date?: string) => request<{ report: DailyReport }>(`/reports/daily${date ? `?date=${date}` : ""}`),
  weekly: (from?: string, to?: string) => {
    const qs = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
    return request<{ report: WeeklyReport }>(`/reports/weekly${qs ? `?${qs}` : ""}`);
  },
  monthly: (month?: number, year?: number) => {
    const qs = new URLSearchParams({ ...(month ? { month: String(month) } : {}), ...(year ? { year: String(year) } : {}) }).toString();
    return request<{ report: MonthlyReport }>(`/reports/monthly${qs ? `?${qs}` : ""}`);
  },
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => request<{ settings: OfficeSettings }>("/settings"),
  update: (data: Partial<OfficeSettings>) =>
    request<{ settings: OfficeSettings }>("/settings", { method: "PUT", body: JSON.stringify(data) }),
};

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
export const activityLogsApi = {
  getAll: (params?: { page?: number; limit?: number; action?: string; user?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<{ logs: any[]; totalLogs: number; totalPages: number; currentPage: number }>(
      `/activity-logs${qs ? `?${qs}` : ""}`
    );
  },
};

// ─── WORK REPORTS ─────────────────────────────────────────────────────────────
export const workReportsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; employeeId?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<{ reports: any[]; totalReports: number; totalPages: number; currentPage: number }>(
      `/work-reports${qs ? `?${qs}` : ""}`
    );
  },
  submit: (data: { tasksCompleted: string; hoursWorked: number; date?: string }) =>
    request<{ message: string; report: any }>("/work-reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  review: (id: string, data: { status: string; managerRemarks: string }) =>
    request<{ message: string; report: any }>(`/work-reports/${id}/review`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  joiningDate: string;
  status: "active" | "inactive";
  avatar?: string;
}

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  workedHours?: number;
  shortageHours?: number;
  status: "present" | "late" | "absent";
  checkInLocation?: { lat: number; lng: number; distance: number };
}

export interface OfficeSettings {
  officeName: string;
  companyName: string;
  lat: number;
  lng: number;
  radius: number;
  workStartTime: string;
  lateAfterMinutes: number;
}

export interface DailyReport {
  type: string;
  date: string;
  summary: { totalActive: number; present: number; late: number; absent: number; attendanceRate: number };
  records: AttendanceRecord[];
}

export interface WeeklyReport {
  type: string;
  from: string;
  to: string;
  totalActive: number;
  dailyBreakdown: { date: string; present: number; late: number; absent: number }[];
}

export interface MonthlyReport {
  type: string;
  month: number;
  year: number;
  attendanceRate: number;
  totalRecords: number;
  employeeSummary: { employeeId: string; employeeName: string; department: string; present: number; late: number; absent: number }[];
}

export interface Leave {
  _id: string;
  employeeId: string | any;
  leaveType: "paid" | "sick" | "unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminComment?: string;
  appliedOn: string;
}

export interface LeaveBalance {
  paid: number;
  sick: number;
}

// ─── LEAVES ───────────────────────────────────────────────────────────────────
export const leavesApi = {
  applyLeave: (data: { leaveType: string; startDate: string; endDate: string; reason: string }) =>
    request<{ success: boolean; data: Leave }>("/leaves/apply", { method: "POST", body: JSON.stringify(data) }),
  getMyLeaves: () =>
    request<{ success: boolean; data: Leave[]; balance: LeaveBalance }>("/leaves/my-leaves"),
  getAllLeaves: () =>
    request<{ success: boolean; data: Leave[] }>("/leaves/all"),
  updateLeaveStatus: (id: string, data: { status: "approved" | "rejected"; adminComment?: string }) =>
    request<{ success: boolean; data: Leave }>(`/leaves/${id}/status`, { method: "PUT", body: JSON.stringify(data) }),
};

export { getToken };
