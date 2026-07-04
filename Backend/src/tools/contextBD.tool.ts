//TODO: TOOL para preguntar a una tabla de la base de datos que contenga un resumen de todas las tablas de la base de datos, por ejemplo (que si pedimos el area de mejor red, vaya a esa tabla primero, vea que tablas estan relacionadas con esa consulta y 
//TODO: luego con eso que ejecute la otra tool de filtro de datos y arme la respuesta). Esto seria como un "remplazante" del prompt que ya le estamos dando a la ia del contexto de la bd.

import { server } from "../config/mcp.js";
import { pool } from "../config/db.js";
import { z } from 'zod';
import logger from '../config/logger.js';

server.registerTool(
    'contextDB',
    {
        description: 'Consulta el catálogo de tablas disponibles en la base de datos para identificar cuáles son relevantes según la pregunta del usuario. Úsala SIEMPRE antes de filtrarDatos para saber qué tablas consultar, sus columnas relevantes y sus relaciones.',
        inputSchema: z.object({
            palabras_clave: z.string().describe('Palabras clave extraídas de la pregunta del usuario, separadas por coma. Ej: "red, cobertura, zona"')
        })
    },
    async ({ palabras_clave }) => {
        try {
            const keywords = palabras_clave.split(',').map(k => k.trim());

            const conditions = keywords.map((_, i) => 
                `(conceptos::text ILIKE $${i + 1} OR sinonimos::text ILIKE $${i + 1})`
            ).join(' OR ');

            const values = keywords.map(k => `%${k}%`);

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

            if (result.rows.length === 0) {
                return {
                    content: [{ type: 'text', text: 'No se encontraron tablas relacionadas con esas palabras clave.' }]
                };
            }

            return {
                content: [{ type: 'text', text: JSON.stringify(result.rows) }]
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Tool contextDB falló: ${message}`);
            return {
                content: [{ type: 'text', text: `Error al consultar el catálogo: ${message}` }]
            };
        }
    }
);