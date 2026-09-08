import { API_BASE_URL, AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/apiConfig";
import { ApiError, apiRequest } from "@/lib/apiClient";
import type { AuthUser } from "@/types/api";

export type UploadKind = "avatar" | "portfolio" | "document";

export interface UploadResponse {
  url: string;
}

/**
 * Comprime a imagem no navegador usando Canvas para garantir upload ultrarrápido
 * e evitar que fotos grandes de celular (>10MB) excedam o limite de upload.
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFile(kind: UploadKind, file: File): Promise<UploadResponse> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const form = new FormData();
  form.append("file", file);

  const url = `${API_BASE_URL.replace(/\/$/, "")}/upload/${kind}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
  } catch (err) {
    throw new ApiError(0, "Falha de rede ao enviar arquivo", err);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data &&
        String((data as { message: unknown }).message)) ||
      `Erro ${res.status}`;
    throw new ApiError(res.status, msg, data);
  }
  return data as UploadResponse;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function uploadAvatar(file: File): Promise<UploadResponse> {
  try {
    const dataUrl = await compressImage(file, 600, 600, 0.85);

    // Tentar enviar para o endpoint /upload/avatar do servidor
    try {
      const res = await uploadFile("avatar", file);
      if (res && res.url) {
        return res;
      }
    } catch {
      // Se o servidor de arquivos der timeout, usa o dataUrl otimizado
    }

    return { url: dataUrl };
  } catch {
    return uploadFile("avatar", file);
  }
}

export const uploadPortfolio = (file: File) => uploadFile("portfolio", file);
export const uploadDocument = (file: File) => uploadFile("document", file);

export async function updateMyAvatar(avatarUrl: string): Promise<AuthUser> {
  // 1. Atualizar imediatamente cache local
  const currentRaw = localStorage.getItem(AUTH_USER_KEY);
  let cachedUser: any = null;
  if (currentRaw) {
    try {
      cachedUser = JSON.parse(currentRaw);
      cachedUser.avatarUrl = avatarUrl;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(cachedUser));
    } catch (e) {
      console.error(e);
    }
  }

  // 2. Sincronizar com o backend
  try {
    const updated = await apiRequest<AuthUser>("/users/me/avatar", {
      method: "PATCH",
      body: { avatarUrl },
    });

    const merged = { ...cachedUser, ...updated, avatarUrl };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    if (cachedUser) {
      return cachedUser;
    }
    throw err;
  }
}

export async function updateMyDocument(documentUrl: string): Promise<AuthUser> {
  const currentRaw = localStorage.getItem(AUTH_USER_KEY);
  let cachedUser: any = null;
  if (currentRaw) {
    try {
      cachedUser = JSON.parse(currentRaw);
      cachedUser.documentUrl = documentUrl;
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(cachedUser));
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const updated = await apiRequest<AuthUser>("/users/me/document", {
      method: "PATCH",
      body: { documentUrl },
    });

    const merged = { ...cachedUser, ...updated, documentUrl };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    if (cachedUser) {
      return cachedUser;
    }
    throw err;
  }
}
