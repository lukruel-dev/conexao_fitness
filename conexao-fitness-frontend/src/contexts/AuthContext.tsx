import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearSession, fetchMe, getStoredUser, login as loginApi, logout as logoutApi, register as registerApi } from "@/services/auth";
import { adminImpersonate } from "@/services/admin";
import { AUTH_TOKEN_KEY } from "@/lib/apiConfig";
import type { AuthUser, LoginDto, RegisterDto } from "@/types/api";
import { toast } from "sonner";

export type DemoPersonaRole = 'ACADEMIA' | 'PERSONAL' | 'NUTRICIONISTA' | 'STUDENT';

export const DEMO_PERSONAS: Record<DemoPersonaRole, AuthUser> = {
  ACADEMIA: {
    id: 'demo-academia-id-001',
    name: 'Academia Conexão Fitness Prime',
    email: 'academia.demo@conexao.com',
    role: 'ACADEMIA',
    status: 'ATIVO',
    avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&auto=format&fit=crop&q=80',
    planName: 'Elite',
    cityBase: 'São Paulo - SP',
    phone: '(11) 3456-7890',
    bio: 'Academia completa de alta performance com musculação pesada, área funcional, spinning e catraca digital inteligente com leitor óptico QR Code.',
  },
  PERSONAL: {
    id: 'demo-personal-id-002',
    name: 'Lucas Silva (Personal Trainer)',
    email: 'personal.demo@conexao.com',
    role: 'PERSONAL',
    status: 'ATIVO',
    avatarUrl: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=300&auto=format&fit=crop&q=80',
    cref: '045812-G/SP',
    professionTitle: 'Personal Trainer & Preparador Físico',
    planName: 'Elite',
    cityBase: 'São Paulo - SP',
    phone: '(11) 98111-2233',
    bio: 'Educador Físico (CREF 045812-G/SP). Pós-graduado em Biomecânica e Fisiologia do Exercício. Especialista em hipertrofia avançada, periodização de força e emagrecimento saudável.',
  },
  NUTRICIONISTA: {
    id: 'demo-nutri-id-004',
    name: 'Dra. Camila Santos (Nutricionista)',
    email: 'nutri.demo@conexao.com',
    role: 'PERSONAL', // Provedor de serviço autônomo
    status: 'ATIVO',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813689-ff82544cb44a?w=300&auto=format&fit=crop&q=80',
    crn: 'CRN-3 48190-D',
    professionTitle: 'Nutricionista Esportiva & Clínica Funcional',
    planName: 'Elite',
    cityBase: 'São Paulo - SP',
    phone: '(11) 97222-4455',
    bio: 'Nutricionista Esportiva (CRN-3 48190-D). Pós-graduada em Nutrição Clínica e Esportiva de Alta Performance. Prescrição de planos alimentares individualizados, cálculo de macros e bioimpedância.',
  },
  STUDENT: {
    id: 'demo-student-id-003',
    name: 'Gabriel Souza (Aluno Conexão)',
    email: 'aluno.demo@conexao.com',
    role: 'STUDENT',
    status: 'ATIVO',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    planName: 'Premium',
    cityBase: 'São Paulo - SP',
    phone: '(11) 99333-5566',
    bio: 'Aluno focado em hipertrofia e consistência. Aluno ativo da Academia Conexão Fitness Prime, treina sob supervisão do Personal Lucas Silva e segue a dieta da Dra. Camila Santos.',
  },
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  isImpersonating: boolean;
  impersonatedRole: DemoPersonaRole | null;
  startImpersonation: (role: DemoPersonaRole) => Promise<void> | void;
  stopImpersonation: () => void;
  login: (dto: LoginDto) => Promise<AuthUser>;
  register: (dto: RegisterDto) => Promise<import("@/types/api").RegisterResponse>;
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

  const [impersonatedRole, setImpersonatedRole] = useState<DemoPersonaRole | null>(() => {
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

  const startImpersonation = useCallback(async (targetRole: DemoPersonaRole) => {
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

    let activeUser: AuthUser = persona;

    // Tenta autenticar diretamente no backend com token JWT autêntico
    try {
      const authRes = await adminImpersonate(targetRole);
      if (authRes?.accessToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, authRes.accessToken);
        activeUser = {
          ...persona,
          ...authRes.user,
          crn: authRes.user?.crn || persona.crn,
          cref: authRes.user?.cref || persona.cref,
          bio: authRes.user?.bio || persona.bio,
          professionTitle: authRes.user?.professionTitle || persona.professionTitle,
        };
      }
    } catch (err) {
      console.warn("[Auth] Usando persona local com fallback de contingência:", err);
    }

    localStorage.setItem("cf_impersonation_active", "true");
    localStorage.setItem("cf_impersonation_role", targetRole);
    localStorage.setItem("cf_user", JSON.stringify(activeUser));

    // Configuração de dados reais e sincronizados para a persona selecionada
    if (targetRole === 'STUDENT') {
      localStorage.setItem("cf_wallet_balance", "180.00");
      const demoEnrollment = {
        id: "demo_enrollment_001",
        studentId: activeUser.id,
        academiaId: "demo-academia-id-001",
        planName: "Plano Conexão VIP (Acesso Livre)",
        amountPaid: 119.9,
        paymentMethod: "CREDIT_CARD",
        paymentStatus: "PAID",
        status: "ACTIVE",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 28 * 86400000).toISOString(),
        qrAccessCode: "CF-DEMO-VIP99",
        daysRemaining: 28,
        student: {
          id: activeUser.id,
          name: activeUser.name,
          email: activeUser.email,
          avatarUrl: activeUser.avatarUrl,
          cpf: '123.456.789-00',
        },
        academia: {
          name: 'Academia Conexão Fitness Prime',
          avatarUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&auto=format&fit=crop&q=80',
          cityBase: 'São Paulo - SP',
          academiaProfile: {
            nomeFantasia: 'Academia Conexão Fitness Prime',
          },
        },
      };
      localStorage.setItem("cf_gym_enrollments_local", JSON.stringify([demoEnrollment]));
      import("@/services/bookings").then((m) => m.getDemoBookings());
    } else if (targetRole === 'ACADEMIA') {
      localStorage.setItem("cf_wallet_balance", "4850.00");
      const demoCheckins = [
        {
          id: "checkin-001",
          studentName: "Gabriel Souza",
          studentPhoto: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
          qrCode: "CF-DEMO-VIP99",
          planName: "Plano Conexão VIP",
          status: "AUTHORIZED",
          timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        },
        {
          id: "checkin-002",
          studentName: "Mariana Lima",
          studentPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
          qrCode: "CF-DEMO-MARI88",
          planName: "Plano Semestral Gold",
          status: "AUTHORIZED",
          timestamp: new Date(Date.now() - 75 * 60000).toISOString(),
        },
        {
          id: "checkin-003",
          studentName: "Rodrigo Alves",
          studentPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
          qrCode: "CF-DEMO-ROD77",
          planName: "Plano Conexão VIP",
          status: "AUTHORIZED",
          timestamp: new Date(Date.now() - 150 * 60000).toISOString(),
        },
      ];
      localStorage.setItem("cf_gym_checkins", JSON.stringify(demoCheckins));
    } else if (targetRole === 'PERSONAL') {
      localStorage.setItem("cf_wallet_balance", "1920.00");
      import("@/services/bookings").then((m) => m.getDemoBookings());
    } else if (targetRole === 'NUTRICIONISTA') {
      localStorage.setItem("cf_wallet_balance", "2450.00");
      import("@/services/bookings").then((m) => m.getDemoBookings());
    }

    setUser(activeUser);
    setIsImpersonating(true);
    setImpersonatedRole(targetRole);

    const labels = {
      ACADEMIA: 'Academia Conexão Fitness Prime (Catraca & Gestão)',
      PERSONAL: 'Lucas Silva (Personal Trainer - CREF)',
      NUTRICIONISTA: 'Dra. Camila Santos (Nutricionista - CRN)',
      STUDENT: 'Gabriel Souza (Aluno Conexão & Passe QR Code)',
    };
    toast.success(`Modo de Teste ativado: Olhando como ${labels[targetRole]}!`);

    window.dispatchEvent(new CustomEvent("cf:session-switched", { detail: { role: targetRole, user: activeUser } }));
  }, [user]);

  const stopImpersonation = useCallback(() => {
    const originalSessionRaw = localStorage.getItem("cf_admin_original_session");
    let restoredUser: AuthUser | null = null;
    if (originalSessionRaw) {
      try {
        const original = JSON.parse(originalSessionRaw);
        if (original.user) {
          restoredUser = original.user;
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

    window.dispatchEvent(new CustomEvent("cf:session-switched", { detail: { role: 'ADMIN', user: restoredUser } }));
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

  const register = useCallback(async (dto: RegisterDto): Promise<import("@/types/api").RegisterResponse> => {
    setLoading(true);
    try {
      const res = await registerApi(dto);
      if ("accessToken" in res && res.accessToken) {
        setUser(res.user);
      }
      return res;
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
