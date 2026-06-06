import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Role, User } from "../api/types";

const TOKEN_KEY = "mygate_token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  applyToken: (newToken: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function homeForRole(role: Role): string {
  if (role === "ADMIN" || role === "COMMITTEE") return "/admin";
  if (role === "SECURITY") return "/security";
  return "/resident";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const applyToken = useCallback((newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }, []);

  const refresh = useCallback(async () => {
    const activeToken = localStorage.getItem(TOKEN_KEY);
    if (!activeToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    setToken(activeToken);
    try {
      const { user: me } = await api.me(activeToken);
      setUser(me);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (phone: string, password: string, role: Role) => {
      const res = await api.login(phone, password, role);
      localStorage.setItem(TOKEN_KEY, res.access_token);
      setToken(res.access_token);
      const { user: me } = await api.me(res.access_token);
      setUser(me);
      if (me.must_change_password) {
        navigate("/setup");
      } else {
        navigate(homeForRole(me.role));
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    navigate("/login");
  }, [navigate]);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, refresh, applyToken }),
    [user, token, loading, login, logout, refresh, applyToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (!loading && user?.must_change_password && pathname !== "/setup") {
      navigate("/setup");
      return;
    }
    if (!loading && user && roles && !roles.includes(user.role)) {
      navigate(user.role === "SECURITY" ? "/security" : user.role === "RESIDENT" ? "/resident" : "/admin");
    }
  }, [user, loading, roles, navigate, pathname]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "3rem", textAlign: "center" }}>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
