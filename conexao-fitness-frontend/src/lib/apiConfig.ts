// ============================================================
// Configuração da API — backend real via cloudflared.
// ============================================================

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.finex.net.br";

export const AUTH_TOKEN_KEY = "cf_access_token";
export const AUTH_USER_KEY = "cf_user";
