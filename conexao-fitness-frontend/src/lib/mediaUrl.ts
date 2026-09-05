import { API_BASE_URL } from "./apiConfig";

/**
 * Normaliza qualquer URL de documento ou mídia para que seja sempre acessível,
 * mesmo que tenha sido salva no banco com localhost:3000, localhost:3001 ou caminho relativo.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  
  // Se for caminho relativo (/uploads/folder/filename)
  if (url.startsWith("/uploads/")) {
    const clean = url.replace(/^\/uploads\//, "");
    return `${API_BASE_URL.replace(/\/$/, "")}/upload/file/${clean}`;
  }

  if (url.startsWith("/")) {
    return `${API_BASE_URL.replace(/\/$/, "")}${url}`;
  }

  // Se for uma URL absoluta com /uploads/ (ex: http://localhost:3001/uploads/... ou https://conexao-fitness.onrender.com/uploads/...)
  if (url.includes("/uploads/")) {
    const parts = url.split("/uploads/");
    if (parts.length > 1) {
      return `${API_BASE_URL.replace(/\/$/, "")}/upload/file/${parts[1]}`;
    }
  }

  // Se for uma URL com localhost de porta divergente (ex: localhost:3000 vs localhost:3001)
  if (url.includes("localhost:") || url.includes("127.0.0.1:")) {
    try {
      const parsed = new URL(url);
      const apiParsed = new URL(API_BASE_URL.startsWith("http") ? API_BASE_URL : `http://${API_BASE_URL}`);
      parsed.protocol = apiParsed.protocol;
      parsed.host = apiParsed.host;
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}

