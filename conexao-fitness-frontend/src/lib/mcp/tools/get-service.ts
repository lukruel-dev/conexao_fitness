import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://aa54f6d827e570.lhr.life";

export default defineTool({
  name: "get_service",
  title: "Get service details",
  description:
    "Fetch the public details of a single fitness service by id from Conexão Fitness.",
  inputSchema: {
    id: z.string().min(1).describe("The service id."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
  handler: async ({ id }) => {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/services/${encodeURIComponent(id)}`;
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        return {
          content: [
            { type: "text", text: `Serviço não encontrado (HTTP ${res.status}).` },
          ],
          isError: true,
        };
      }
      const service = await res.json();
      return {
        content: [{ type: "text", text: JSON.stringify(service, null, 2) }],
        structuredContent: { service },
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
