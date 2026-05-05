import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AUTH_EXPIRED_EVENT, api, clearAuthTokens, setAuthTokens } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "manager" | "technician" | "viewer" | "sales";
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const ACCESS_TOKEN_KEY = "erp-access-token";
const REFRESH_TOKEN_KEY = "erp-refresh-token";
const AUTH_USER_KEY = "erp-auth-user";
const ROLE_KEY = "erp-current-role";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = useMemo(() => Boolean(localStorage.getItem(ACCESS_TOKEN_KEY)), [user]);

  useEffect(() => {
    if (!user) localStorage.removeItem(AUTH_USER_KEY);
    else localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<
        ApiSuccess<{ token: string; refreshToken: string; user: AuthUser }>
      >("/api/v1/auth/login", { email, password });
      const data = res.data.data;
      setAuthTokens(data.token, data.refreshToken);
      setUser(data.user);
      localStorage.setItem(ROLE_KEY, data.user.role);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (refreshToken) await api.post("/api/v1/auth/logout", { refreshToken });
    } catch {
      // keep local logout resilient even if backend revoke fails
    } finally {
      clearAuthTokens();
      setUser(null);
      localStorage.removeItem(ROLE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
