import { ReactNode, useState } from "react";
import AppSidebar from "./AppSidebar";
import { Menu, X } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full w-64">
            <AppSidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 p-4 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-sm">Zenithyuga Ets</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
