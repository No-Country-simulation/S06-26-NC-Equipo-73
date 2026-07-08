import { server } from "../config/mcp.js";
import { z } from 'zod';
import { executeContextDB } from './tool-executors.js';

server.registerTool(
    'contextDB',
    {
        description: 'Consulta el catálogo de tablas disponibles en la base de datos para identificar cuáles son relevantes según la pregunta del usuario. Úsala SIEMPRE antes de filtrarDatos para saber qué tablas consultar, sus columnas relevantes y sus relaciones.',
        inputSchema: z.object({
            palabras_clave: z.string().describe('Palabras clave extraídas de la pregunta del usuario, separadas por coma. Ej: "red, cobertura, zona"')
        })
    },
    async ({ palabras_clave }) => {
        const result = await executeContextDB(palabras_clave);

        return {
            content: [{ type: 'text', text: JSON.stringify(result) }]
        };
    }
);
