import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/zenithyuga-logo.png";
import {
  LayoutDashboard,
  Users,
  QrCode,
  ClipboardList,
  FileBarChart,
  Settings,
  LogOut,
  ScanLine,
  History,
  CalendarDays,
} from "lucide-react";

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Employees", icon: Users, path: "/admin/employees" },
  { label: "QR Code", icon: QrCode, path: "/admin/qr-code" },
  { label: "Attendance", icon: ClipboardList, path: "/admin/attendance" },
  { label: "Leaves", icon: CalendarDays, path: "/admin/leaves" },
  { label: "Reports", icon: FileBarChart, path: "/admin/reports" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const employeeNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/employee/dashboard" },
  { label: "Scan QR", icon: ScanLine, path: "/employee/scan" },
  { label: "Leaves", icon: CalendarDays, path: "/employee/leaves" },
];

const hrNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/hr/dashboard" },
  { label: "Employees", icon: Users, path: "/hr/employees" },
  { label: "QR Code", icon: QrCode, path: "/hr/qr-code" },
  { label: "Attendance", icon: ClipboardList, path: "/hr/attendance" },
  { label: "Leaves", icon: CalendarDays, path: "/hr/leaves" },
  { label: "Reports", icon: FileBarChart, path: "/hr/reports" },
  { label: "Settings", icon: Settings, path: "/hr/settings" },
];

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = user?.role === "admin" ? adminNav : user?.role === "hr" ? hrNav : employeeNav;

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-card border-r border-border">
      <div className="p-5 border-b border-border">
        <img src={logo} alt="Zenithyuga Ets" className="h-10 object-contain" />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full zy-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.employeeId}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
