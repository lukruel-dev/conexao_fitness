import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearSession, fetchMe, getStoredUser, login as loginApi, logout as logoutApi, register as registerApi } from "@/services/auth";
import { AUTH_TOKEN_KEY } from "@/lib/apiConfig";
import type { AuthUser, LoginDto, RegisterDto } from "@/types/api";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (dto: LoginDto) => Promise<AuthUser>;
  register: (dto: RegisterDto) => Promise<AuthUser>;
  oauthLogin: (dto: import("@/types/api").OAuthDto) => Promise<import("@/types/api").AuthResponse | import("@/types/api").OAuthPendingResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      setUser(null);
    };
    window.addEventListener("cf:unauthorized", onUnauthorized);
    return () => window.removeEventListener("cf:unauthorized", onUnauthorized);
  }, []);

  // Revalida sessão contra /auth/me ao montar (se houver token salvo).
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    fetchMe()
      .then((fresh) => setUser(fresh))
      .catch(() => {
        // 401 já dispara cf:unauthorized via apiClient
      });
  }, []);

  const login = useCallback(async (dto: LoginDto): Promise<AuthUser> => {
    setLoading(true);
    try {
      const res = await loginApi(dto);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (dto: RegisterDto): Promise<AuthUser> => {
    setLoading(true);
    try {
      const res = await registerApi(dto);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOAuthLogin = useCallback(async (dto: import("@/types/api").OAuthDto) => {
    setLoading(true);
    try {
      const { oauthLogin: apiOAuthLogin } = await import("@/services/auth");
      const res = await apiOAuthLogin(dto);
      if ("accessToken" in res && res.accessToken) {
        setUser(res.user);
      }
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    logoutApi();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await fetchMe();
    setUser(fresh);
  }, []);

  const setUserExternal = useCallback((u: AuthUser) => {
    setUser(u);
    localStorage.setItem("cf_user", JSON.stringify(u));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      oauthLogin: handleOAuthLogin,
      logout,
      refreshUser,
      setUser: setUserExternal,
    }),
    [user, loading, login, register, handleOAuthLogin, logout, refreshUser, setUserExternal],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
