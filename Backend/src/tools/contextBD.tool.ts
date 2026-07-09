import { server } from "../config/mcp.js";
import { pool } from "../config/db.js";
import { z } from 'zod';
import logger from '../config/logger.js';

export async function executeContextDB(palabras_clave: string) {
    try {
        const keywords = palabras_clave
            .split(',')
            .map((keyword) => keyword.trim())
            .filter(Boolean);

        if (keywords.length === 0) {
            return {
                ok: false,
                error: 'Debes indicar al menos una palabra clave para consultar el catálogo.',
                rows: [],
            };
        }

        const conditions = keywords.map((_, i) =>
            `(conceptos::text ILIKE $${i + 1} OR sinonimos::text ILIKE $${i + 1})`
        ).join(' OR ');

        const values = keywords.map((keyword) => `%${keyword}%`);

        const query = `
            SELECT
                nombre_tabla,
                dominio,
                descripcion,
                columnas_relevantes,
                relaciones,
                advertencias,
                prioridad_busqueda
            FROM "catalogo_tablas_datos"
            WHERE habilitada_mcp = true
            AND (${conditions})
            ORDER BY prioridad_busqueda ASC
            LIMIT 5
        `;

        const result = await pool.query(query, values);

        return {
            ok: true,
            rows: result.rows,
            message: result.rows.length === 0
                ? 'No se encontraron tablas relacionadas con esas palabras clave.'
                : undefined,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Tool contextDB falló: ${message}`);
        return {
            ok: false,
            error: `Error al consultar el catálogo: ${message}`,
            rows: [],
        };
    }
}

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
