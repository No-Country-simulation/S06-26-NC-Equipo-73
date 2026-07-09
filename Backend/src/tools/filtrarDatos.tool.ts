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
    };

    const tienePalabraProhibida = PALABRAS_PROHIBIDAS.some((palabra) =>
        new RegExp(`\\b${palabra}\\b`).test(queryLimpia)
    );

    if (tienePalabraProhibida) {
        return { valida: false, motivo: 'La consulta contiene operaciones no permitidas.' };
    };

    const cantidadSentencias = queryLimpia.split(';').filter((s) => s.trim().length > 0).length;
    if (cantidadSentencias > 1) {
        return { valida: false, motivo: 'Solo se permite una sentencia SQL por consulta.' };
    };

    return { valida: true };
};

function aplicarLimite(query: string): string {
    const queryLimpia = query.trim().replace(/;$/, '');
    const yaTieneLimit = /\blimit\b/i.test(queryLimpia);

    if (yaTieneLimit) {
        return queryLimpia;
    };

    return `${queryLimpia} LIMIT ${LIMITE_MAXIMO_FILAS}`;
};

export async function executeFiltrarDatos(query: string) {
    logger.info(`Tool filtrarDatos recibió: ${query}`);

    const validacion = esQuerySegura(query);
    if (!validacion.valida) {
        logger.error(`Query rechazada: ${validacion.motivo} | Query: ${query}`);
        return {
            ok: false,
            error: `Consulta rechazada: ${validacion.motivo}`,
            rows: [],
        };
    };

    const queryConLimite = aplicarLimite(query);

    try {
        const result = await pool.query(queryConLimite);

        logger.info(`Tool filtrarDatos: ${result.rows.length} filas devueltas`);

        return {
            ok: true,
            rows: result.rows,
            appliedQuery: queryConLimite,
            message: result.rows.length === 0 ? 'La consulta no devolvió resultados.' : undefined,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Tool filtrarDatos falló: ${message} | Query: ${queryConLimite}`);

        return {
            ok: false,
            error: `Error al ejecutar la consulta: ${message}`,
            rows: [],
            appliedQuery: queryConLimite,
        };
    }
}

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
