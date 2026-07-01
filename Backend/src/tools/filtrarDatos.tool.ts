import { server } from "../config/mcp.js";
import { pool } from "../config/db.js";
import { z } from 'zod';
import logger from '../config/logger.js';

const PALABRAS_PROHIBIDAS = [
    'delete', 'update', 'drop', 'insert', 'alter',
    'truncate', 'grant', 'revoke', 'create', 'replace'
];

const LIMITE_MAXIMO_FILAS = 200;

function esQuerySegura(query: string): { valida: boolean; motivo?: string } {
    const queryLimpia = query.trim().toLowerCase();

    if (!queryLimpia.startsWith('select')) {
        return { valida: false, motivo: 'Solo se permiten consultas SELECT.' };
    }

    const tienePalabraProhibida = PALABRAS_PROHIBIDAS.some((palabra) =>
        new RegExp(`\\b${palabra}\\b`).test(queryLimpia)
    );

    if (tienePalabraProhibida) {
        return { valida: false, motivo: 'La consulta contiene operaciones no permitidas.' };
    }

    const cantidadSentencias = queryLimpia.split(';').filter((s) => s.trim().length > 0).length;
    if (cantidadSentencias > 1) {
        return { valida: false, motivo: 'Solo se permite una sentencia SQL por consulta.' };
    }

    return { valida: true };
}

function aplicarLimite(query: string): string {
    const queryLimpia = query.trim().replace(/;$/, ''); 
    const yaTieneLimit = /\blimit\b/i.test(queryLimpia);

    if (yaTieneLimit) {
        return queryLimpia;
    }

    return `${queryLimpia} LIMIT ${LIMITE_MAXIMO_FILAS}`;
}

server.registerTool(
    'filtrarDatos',
    {
        description: 'Ejecuta una consulta SQL de tipo SELECT contra la base de datos de App BiT para responder preguntas sobre movilidad, cobertura de red, formación, empleo y salud mental por región. El esquema completo de tablas está disponible en el contexto del sistema. Genera la consulta SQL según esa información y pásala aquí para obtener los datos reales.',
        inputSchema: z.object({
            query: z.string().describe('Consulta SQL SELECT a ejecutar, basada en el esquema de tablas provisto en el contexto.')
        })
    },
    async ({ query }) => {
        logger.info(`Tool filtrarDatos recibió: ${query}`);

        const validacion = esQuerySegura(query);
        if (!validacion.valida) {
            logger.error(`Query rechazada: ${validacion.motivo} | Query: ${query}`);
            return {
                content: [{ type: 'text', text: `Consulta rechazada: ${validacion.motivo}` }]
            };
        }

        const queryConLimite = aplicarLimite(query);

        try {
            const result = await pool.query(queryConLimite);

            logger.info(`Tool filtrarDatos: ${result.rows.length} filas devueltas`);

            if (result.rows.length === 0) {
                return {
                    content: [{ type: 'text', text: 'La consulta no devolvió resultados.' }]
                };
            }

            return {
                content: [{ type: 'text', text: JSON.stringify(result.rows) }]
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Tool filtrarDatos falló: ${message} | Query: ${queryConLimite}`);

            return {
                content: [{ type: 'text', text: `Error al ejecutar la consulta: ${message}` }]
            };
        }
    }
);