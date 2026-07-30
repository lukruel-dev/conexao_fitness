import { defineMcp } from "@lovable.dev/mcp-js";
import searchServicesTool from "./tools/search-services";
import getServiceTool from "./tools/get-service";

export default defineMcp({
  name: "conexao-fitness-mcp",
  title: "Conexão Fitness MCP",
  version: "0.1.0",
  instructions:
    "Ferramentas públicas do marketplace Conexão Fitness. Use `search_services` para descobrir personal trainers e academias publicados, e `get_service` para detalhes de um serviço específico.",
  tools: [searchServicesTool, getServiceTool],
});
