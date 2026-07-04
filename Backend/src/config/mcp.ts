import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import logger from "./logger.js";

export const server = new McpServer(
    {
        name: 'MCP AI - App BiT (B2G)',
        version: '1.0.0'
    },
    {
        capabilities: {
            tools: {}, resources: {}, prompts: {}
        }
    }
);
 logger.info('Servidor MCP iniciado correctamente.');
