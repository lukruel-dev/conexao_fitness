import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://aa54f6d827e570.lhr.life";

export default defineTool({
  name: "search_services",
  title: "Search fitness services",
  description:
    "Search publicly listed fitness services (personal trainers and gyms) on Conexão Fitness. Returns basic public info: name, modality, provider type, price and city. Filters are optional.",
  inputSchema: {
    q: z.string().optional().describe("Free-text query (name, modality, etc)."),
    modality: z
      .string()
      .optional()
      .describe("Modality filter, e.g. musculação, yoga, funcional."),
    providerType: z
      .enum(["PERSONAL", "ACADEMIA"])
      .optional()
      .describe("Restrict to personal trainers or gyms."),
    city: z.string().optional().describe("Filter by city."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async (input) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    }
    const url = `${API_BASE_URL.replace(/\/$/, "")}/services${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        return {
          content: [
            { type: "text", text: `Falha ao buscar serviços (HTTP ${res.status}).` },
          ],
          isError: true,
        };
      }
      const data = (await res.json()) as Array<Record<string, unknown>>;
      const trimmed = (Array.isArray(data) ? data : []).slice(0, 25).map((s) => ({
        id: s.id,
        name: s.name,
        modality: s.modality,
        providerType: s.providerType,
        type: s.type,
        price: s.price,
        currency: s.currency,
        durationMinutes: s.durationMinutes,
        city: s.city,
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(trimmed, null, 2) }],
        structuredContent: { services: trimmed },
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Erro de rede ao acessar a API: ${(err as Error).message}`,
          },
        ],
        isError: true,
      };
    }
  },
});
