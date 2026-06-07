import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../api/client";
import type { Role, User } from "../api/types";

const TOKEN_KEY = "mygate_token";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!stored) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    setToken(stored);
    try {
      const { user: me } = await api.me(stored);
      setUser(me);
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (phone: string, password: string, role: Role) => {
    const res = await api.login(phone, password, role);
    await SecureStore.setItemAsync(TOKEN_KEY, res.access_token);
    setToken(res.access_token);
    const { user: me } = await api.me(res.access_token);
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, refresh }),
    [user, token, loading, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
