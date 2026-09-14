import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearSession, fetchMe, getStoredUser, login as loginApi, logout as logoutApi, register as registerApi } from "@/services/auth";
import { AUTH_TOKEN_KEY } from "@/lib/apiConfig";
import type { AuthUser, LoginDto, RegisterDto } from "@/types/api";
import { toast } from "sonner";

export const DEMO_PERSONAS: Record<'ACADEMIA' | 'PERSONAL' | 'STUDENT', AuthUser> = {
  ACADEMIA: {
    id: 'demo-academia-id-001',
    name: 'Academia Conexão Fitness (Demo Teste)',
    email: 'academia.demo@conexao.com',
    role: 'ACADEMIA',
    status: 'ATIVO',
    avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80',
    planName: 'Elite',
    bio: 'Academia completa de testes com musculação, funcional e catraca digital configurada.',
  },
  PERSONAL: {
    id: 'demo-personal-id-002',
    name: 'Lucas Silva - Personal Trainer (Demo Teste)',
    email: 'personal.demo@conexao.com',
    role: 'PERSONAL',
    status: 'ATIVO',
    avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=200&auto=format&fit=crop&q=80',
    cref: '045812-G/SP',
    planName: 'Elite',
    bio: 'Treinador especialista em biomecânica, hipertrofia e emagrecimento saudável.',
  },
  STUDENT: {
    id: 'demo-student-id-003',
    name: 'Gabriel Souza (Aluno Demo Teste)',
    email: 'aluno.demo@conexao.com',
    role: 'STUDENT',
    status: 'ATIVO',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    planName: 'Premium',
  },
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  isImpersonating: boolean;
  impersonatedRole: 'ACADEMIA' | 'PERSONAL' | 'STUDENT' | null;
  startImpersonation: (role: 'ACADEMIA' | 'PERSONAL' | 'STUDENT') => void;
  stopImpersonation: () => void;
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

  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
    return localStorage.getItem("cf_impersonation_active") === "true";
  });

  const [impersonatedRole, setImpersonatedRole] = useState<'ACADEMIA' | 'PERSONAL' | 'STUDENT' | null>(() => {
    return (localStorage.getItem("cf_impersonation_role") as any) || null;
  });

  useEffect(() => {
    const onUnauthorized = () => {
      // Se estiver em impersonation, não desloga tudo abruptamente
      if (localStorage.getItem("cf_impersonation_active") === "true") {
        return;
      }
      clearSession();
      setUser(null);
    };
    window.addEventListener("cf:unauthorized", onUnauthorized);
    return () => window.removeEventListener("cf:unauthorized", onUnauthorized);
  }, []);

  // Revalida sessão contra /auth/me ao montar (se houver token salvo e NÃO estiver em modo teste).
  useEffect(() => {
    const isTesting = localStorage.getItem("cf_impersonation_active") === "true";
    if (isTesting) return;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    fetchMe()
      .then((fresh) => setUser(fresh))
      .catch(() => {
        // 401 já dispara cf:unauthorized via apiClient
      });
  }, []);

  const startImpersonation = useCallback((targetRole: 'ACADEMIA' | 'PERSONAL' | 'STUDENT') => {
    const currentToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const alreadyImpersonating = localStorage.getItem("cf_impersonation_active") === "true";

    // Salva a sessão real do admin caso ainda não tenha sido salva
    if (!alreadyImpersonating && user) {
      localStorage.setItem("cf_admin_original_session", JSON.stringify({
        user,
        token: currentToken,
      }));
    }

    const persona = DEMO_PERSONAS[targetRole];
    if (!persona) return;

    localStorage.setItem("cf_impersonation_active", "true");
    localStorage.setItem("cf_impersonation_role", targetRole);
    localStorage.setItem("cf_user", JSON.stringify(persona));

    // Configura sementes amigáveis para teste
    if (targetRole === 'STUDENT') {
      localStorage.setItem("cf_wallet_balance", "180.00");
      const existingEnrollments = JSON.parse(localStorage.getItem("cf_gym_enrollments_local") || "[]");
      if (existingEnrollments.length === 0) {
        const demoEnrollment = {
          id: "demo_enrollment_001",
          studentId: persona.id,
          academiaId: "demo-academia-id-001",
          planName: "Plano Conexão VIP (Acesso Livre)",
          amountPaid: 119.9,
          paymentMethod: "CREDIT_CARD",
          paymentStatus: "PAID",
          status: "ACTIVE",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          qrAccessCode: "CF-DEMO-VIP99",
          daysRemaining: 30,
          student: {
            id: persona.id,
            name: persona.name,
            email: persona.email,
            avatarUrl: persona.avatarUrl,
            cpf: '123.456.789-00',
          },
        };
        localStorage.setItem("cf_gym_enrollments_local", JSON.stringify([demoEnrollment]));
      }
    } else if (targetRole === 'ACADEMIA') {
      localStorage.setItem("cf_wallet_balance", "1450.00");
    } else if (targetRole === 'PERSONAL') {
      localStorage.setItem("cf_wallet_balance", "920.00");
    }

    setUser(persona);
    setIsImpersonating(true);
    setImpersonatedRole(targetRole);

    const labels = {
      ACADEMIA: 'Academia (Gestão & Catraca)',
      PERSONAL: 'Profissional (Personal Trainer)',
      STUDENT: 'Aluno (Passe QR Code & Carteira)',
    };
    toast.success(`Modo de Teste ativado: Olhando como ${labels[targetRole]}!`);
  }, [user]);

  const stopImpersonation = useCallback(() => {
    const originalSessionRaw = localStorage.getItem("cf_admin_original_session");
    if (originalSessionRaw) {
      try {
        const original = JSON.parse(originalSessionRaw);
        if (original.user) {
          setUser(original.user);
          localStorage.setItem("cf_user", JSON.stringify(original.user));
        }
        if (original.token) {
          localStorage.setItem(AUTH_TOKEN_KEY, original.token);
        }
      } catch (err) {
        console.error("Erro ao restaurar sessão de administrador:", err);
      }
    }

    localStorage.removeItem("cf_admin_original_session");
    localStorage.removeItem("cf_impersonation_active");
    localStorage.removeItem("cf_impersonation_role");
    setIsImpersonating(false);
    setImpersonatedRole(null);

    toast.info("Você voltou ao Modo Administrador com todos os privilégios.");
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
    localStorage.removeItem("cf_admin_original_session");
    localStorage.removeItem("cf_impersonation_active");
    localStorage.removeItem("cf_impersonation_role");
    setIsImpersonating(false);
    setImpersonatedRole(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (localStorage.getItem("cf_impersonation_active") === "true") return;
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
      isImpersonating,
      impersonatedRole,
      startImpersonation,
      stopImpersonation,
      login,
      register,
      oauthLogin: handleOAuthLogin,
      logout,
      refreshUser,
      setUser: setUserExternal,
    }),
    [
      user,
      loading,
      isImpersonating,
      impersonatedRole,
      startImpersonation,
      stopImpersonation,
      login,
      register,
      handleOAuthLogin,
      logout,
      refreshUser,
      setUserExternal,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}
