// Serviço de integração oficial com Sign in with Apple JS (OAuth 2.0 / Apple ID)

export interface AppleUserProfile {
  email: string;
  name: string;
  avatarUrl?: string;
  sub?: string;
}

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (options: {
          clientId: string;
          scope?: string;
          redirectURI: string;
          state?: string;
          nonce?: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: {
            code: string;
            id_token: string;
            state?: string;
          };
          user?: {
            name?: {
              firstName?: string;
              lastName?: string;
            };
            email?: string;
          };
        }>;
        renderButton?: (container: HTMLElement, options: any) => void;
      };
    };
  }
}

let scriptLoaded = false;

export function loadAppleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (scriptLoaded || window.AppleID) {
      resolve();
      return;
    }

    const existing = document.getElementById("apple-jssdk");
    if (existing) {
      scriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "apple-jssdk";
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/auth.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = (err) => {
      reject(new Error("Falha ao carregar SDK da Apple"));
    };
    document.head.appendChild(script);
  });
}

function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

export async function triggerAppleSignIn(): Promise<AppleUserProfile> {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;

  if (!clientId) {
    throw new Error("VITE_APPLE_CLIENT_ID não configurado no .env");
  }

  await loadAppleScript();

  if (!window.AppleID?.auth) {
    throw new Error("Apple Sign In SDK não disponível.");
  }

  const redirectURI =
    import.meta.env.VITE_APPLE_REDIRECT_URI || window.location.origin;

  // Inicializa o cliente Apple ID
  window.AppleID.auth.init({
    clientId: clientId,
    scope: "name email",
    redirectURI: redirectURI,
    usePopup: true,
  });

  try {
    const response = await window.AppleID.auth.signIn();
    const idToken = response.authorization?.id_token;
    const tokenPayload = idToken ? parseJwt(idToken) : {};

    // Apple envia o objeto user apenas no primeiro login
    let fullName = "Usuário Apple";
    if (response.user?.name) {
      const { firstName, lastName } = response.user.name;
      fullName = [firstName, lastName].filter(Boolean).join(" ") || fullName;
    } else if (tokenPayload.email) {
      const emailUser = tokenPayload.email.split("@")[0];
      fullName = emailUser.charAt(0).toUpperCase() + emailUser.slice(1);
    }

    const email = response.user?.email || tokenPayload.email;
    if (!email) {
      throw new Error("E-mail não fornecido pela autenticação Apple.");
    }

    return {
      email,
      name: fullName,
      sub: tokenPayload.sub,
      avatarUrl: undefined, // Apple não expõe foto pública por privacidade
    };
  } catch (error: any) {
    if (
      error?.error === "popup_closed_by_user" ||
      error?.message?.includes("closed") ||
      error?.message?.includes("canceled") ||
      error?.message?.includes("cancel")
    ) {
      throw new Error("Login Apple cancelado pelo usuário");
    }
    throw error;
  }
}
