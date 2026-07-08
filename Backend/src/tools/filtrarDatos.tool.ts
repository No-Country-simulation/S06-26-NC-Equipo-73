import { server } from "../config/mcp.js";
import { z } from 'zod';
import { executeFiltrarDatos } from './tool-executors.js';

server.registerTool(
    'filtrarDatos',
    {
        description: 'Ejecuta una consulta SQL de tipo SELECT contra la base de datos de App BiT. Úsala SIEMPRE después de contextDB, usando los nombres de tablas y columnas que esa tool te devolvió. No uses tablas o columnas que no hayan sido confirmadas por contextDB.',
        inputSchema: z.object({
            query: z.string().describe('Consulta SQL SELECT a ejecutar, basada en el esquema de tablas provisto en el contexto.')
        })
    },
    async ({ query }) => {
        const result = await executeFiltrarDatos(query);

        return {
            content: [{ type: 'text', text: JSON.stringify(result) }]
        };
    }
);
