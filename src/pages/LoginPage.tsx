import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/zenithyuga-logo.png";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "employee" | "hr">("employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const success = await login(email, password, role);
      if (success) {
        navigate(role === "admin" ? "/admin/dashboard" : role === "hr" ? "/hr/dashboard" : "/employee/dashboard");
      } else {
        setError("Invalid credentials. Please check your email and password.");
      }
    } catch {
      setError("Connection error. Make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl p-8 zy-shadow">
          <div className="text-center mb-8">
            <img src={logo} alt="Zenithyuga Ets" className="h-12 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Bring Your Worth</p>
          </div>

          {/* Role toggle */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            {(["employee", "hr", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  role === r
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "admin" ? "Admin" : r === "hr" ? "HR" : "Employee"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Email / Employee ID
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@zenithyuga.com"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg zy-gradient text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            © 2026 Zenithyuga Ets
          </p>
        </div>
      </motion.div>
    </div>
  );
}
