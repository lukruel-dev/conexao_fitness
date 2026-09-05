import { API_BASE_URL, AUTH_TOKEN_KEY } from "@/lib/apiConfig";
import { ApiError, apiRequest } from "@/lib/apiClient";
import type { AuthUser } from "@/types/api";

export type UploadKind = "avatar" | "portfolio" | "document";

export interface UploadResponse {
  url: string;
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

export const uploadAvatar = (file: File) => uploadFile("avatar", file);
export const uploadPortfolio = (file: File) => uploadFile("portfolio", file);
export const uploadDocument = (file: File) => uploadFile("document", file);

export async function updateMyAvatar(avatarUrl: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/users/me/avatar", {
    method: "PATCH",
    body: { avatarUrl },
  });
}

export async function updateMyDocument(documentUrl: string): Promise<AuthUser> {
  return apiRequest<AuthUser>("/users/me/document", {
    method: "PATCH",
    body: { documentUrl },
  });
}
