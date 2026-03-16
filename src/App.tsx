import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeesPage from "./pages/EmployeesPage";
import QRCodePage from "./pages/QRCodePage";
import AttendancePage from "./pages/AttendancePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import ScannerPage from "./pages/ScannerPage";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeLeavesPage from "./pages/EmployeeLeavesPage";
import AdminLeavesPage from "./pages/AdminLeavesPage";
import HRDashboard from "./pages/HRDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, role }: { children: React.ReactNode; role: "admin" | "employee" | "hr" }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}


const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/employees" element={<ProtectedRoute role="admin"><EmployeesPage /></ProtectedRoute>} />
    <Route path="/admin/qr-code" element={<ProtectedRoute role="admin"><QRCodePage /></ProtectedRoute>} />
    <Route path="/admin/attendance" element={<ProtectedRoute role="admin"><AttendancePage /></ProtectedRoute>} />
    <Route path="/admin/leaves" element={<ProtectedRoute role="admin"><AdminLeavesPage /></ProtectedRoute>} />
    <Route path="/admin/reports" element={<ProtectedRoute role="admin"><ReportsPage /></ProtectedRoute>} />
    <Route path="/admin/settings" element={<ProtectedRoute role="admin"><SettingsPage /></ProtectedRoute>} />
    <Route path="/hr/dashboard" element={<ProtectedRoute role="hr"><HRDashboard /></ProtectedRoute>} />
    <Route path="/hr/employees" element={<ProtectedRoute role="hr"><EmployeesPage /></ProtectedRoute>} />
    <Route path="/hr/qr-code" element={<ProtectedRoute role="hr"><QRCodePage /></ProtectedRoute>} />
    <Route path="/hr/attendance" element={<ProtectedRoute role="hr"><AttendancePage /></ProtectedRoute>} />
    <Route path="/hr/leaves" element={<ProtectedRoute role="hr"><AdminLeavesPage /></ProtectedRoute>} />
    <Route path="/hr/reports" element={<ProtectedRoute role="hr"><ReportsPage /></ProtectedRoute>} />
    <Route path="/hr/settings" element={<ProtectedRoute role="hr"><SettingsPage /></ProtectedRoute>} />
    <Route path="/employee/scan" element={<ProtectedRoute role="employee"><ScannerPage /></ProtectedRoute>} />
    <Route path="/employee/dashboard" element={<ProtectedRoute role="employee"><EmployeeDashboard /></ProtectedRoute>} />
    <Route path="/employee/leaves" element={<ProtectedRoute role="employee"><EmployeeLeavesPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
