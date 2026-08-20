import { apiRequest } from "@/lib/apiClient";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/apiConfig";
import type { AuthResponse, AuthUser, LoginDto, RegisterDto } from "@/types/api";

export function persistSession(res: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, res.accessToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
}

export function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function login(dto: LoginDto): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/auth/login", { method: "POST", body: dto });
  persistSession(res);
  return res;
}

export async function register(dto: RegisterDto): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/auth/register", { method: "POST", body: dto });
  persistSession(res);
  return res;
}

export async function oauthLogin(dto: import("@/types/api").OAuthDto): Promise<AuthResponse | import("@/types/api").OAuthPendingResponse> {
  const res = await apiRequest<AuthResponse | import("@/types/api").OAuthPendingResponse>("/auth/oauth", {
    method: "POST",
    body: dto,
  });

  if ("accessToken" in res && res.accessToken) {
    persistSession(res);
  }
  return res;
}

export async function logout() {
  clearSession();
}

export async function fetchMe(): Promise<AuthUser> {
  const res = await apiRequest<{user?: AuthUser} | AuthUser>("/auth/me");
  // O NestJS pode retornar { user: {...} } ou diretamente o objeto user dependendo da rota
  const userData = 'user' in res && res.user ? res.user : res as AuthUser;
  
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
  return userData;
}
