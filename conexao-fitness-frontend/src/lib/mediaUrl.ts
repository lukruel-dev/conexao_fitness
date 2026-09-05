import { API_BASE_URL } from "./apiConfig";

/**
 * Normaliza qualquer URL de documento ou mídia para que seja sempre acessível,
 * mesmo que tenha sido salva no banco com localhost:3000, localhost:3001 ou caminho relativo.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  
  // Se for caminho relativo (/uploads/...)
  if (url.startsWith("/")) {
    return `${API_BASE_URL.replace(/\/$/, "")}${url}`;
  }

  // Se for uma URL com localhost de porta divergente (ex: localhost:3000 vs localhost:3001)
  if (url.includes("localhost:") || url.includes("127.0.0.1:")) {
    try {
      const parsed = new URL(url);
      const apiParsed = new URL(API_BASE_URL.startsWith("http") ? API_BASE_URL : `http://${API_BASE_URL}`);
      // Substitui o host e porta pelo API_BASE_URL atual
      parsed.protocol = apiParsed.protocol;
      parsed.host = apiParsed.host;
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}
