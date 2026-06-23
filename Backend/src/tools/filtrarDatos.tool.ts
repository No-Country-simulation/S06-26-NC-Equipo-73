import { server } from "../config/mcp.js";
import { z } from 'zod';

server.registerTool(
    'BuscarDatos',
    {
        description: 'Buscar datos en la base de una consulta',
        inputSchema: z.object({
            resultado: z.string().describe('Consulta o criterio de búsqueda para filtrar datos de la base de datos')
        })
    },
    async ({ resultado }) => ({
        content: [{ type: 'text', text: `Resultado: ${resultado}` }]
    })
);

