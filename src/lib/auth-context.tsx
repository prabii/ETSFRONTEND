import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "./api";

type UserRole = "admin" | "employee" | "hr";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from localStorage token
  useEffect(() => {
    const token = localStorage.getItem("zy_token");
    if (token) {
      authApi.me()
        .then((res) => setUser(res.user as User))
        .catch(() => localStorage.removeItem("zy_token"))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const res = await authApi.login(email, password, role);
      if (res.success && res.token) {
        localStorage.setItem("zy_token", res.token);
        setUser(res.user as User);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore API logout errors (e.g., if token already expired)
    } finally {
      localStorage.removeItem("zy_token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
