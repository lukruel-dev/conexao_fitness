// Serviço de integração oficial com Google Identity Services (OAuth 2.0 / GSI)

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  sub?: string;
}

let scriptLoaded = false;

export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve) => {
    if (scriptLoaded || window.google?.accounts) {
      resolve();
      return;
    }

    const existing = document.getElementById("google-gsi-client");
    if (existing) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

export async function triggerGoogleSignIn(): Promise<GoogleUserProfile> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID não configurado no .env");
  }

  await loadGoogleScript();

  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Identity Services não disponível.");
  }

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile openid",
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }

        try {
          // Busca os dados oficiais completos do usuário diretamente do Google
          const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          });

          if (!userInfoRes.ok) {
            throw new Error("Falha ao obter perfil do Google");
          }

          const userInfo = await userInfoRes.json();
          resolve({
            email: userInfo.email,
            name: userInfo.name || userInfo.given_name || "Usuário Google",
            picture: userInfo.picture,
            sub: userInfo.sub,
          });
        } catch (err) {
          reject(err);
        }
      },
    });

    // Abre a janela oficial do Google solicitando login e 2FA
    tokenClient.requestAccessToken({ prompt: "select_account" });
  });
}
