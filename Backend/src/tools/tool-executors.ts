import type { FunctionDeclaration } from '@google/generative-ai';
import { SchemaType } from '@google/generative-ai';
import { pool } from '../config/db.js';
import logger from '../config/logger.js';

const MAX_CATALOG_RESULTS = 5;
const MAX_QUERY_ROWS = 200;
const FORBIDDEN_SQL_WORDS = [
    'delete', 'update', 'drop', 'insert', 'alter',
    'truncate', 'grant', 'revoke', 'create', 'replace',
];

export const AI_TOOL_DECLARATIONS: FunctionDeclaration[] = [
    {
        name: 'contextDB',
        description: 'Consulta el catálogo de tablas disponibles en la base de datos para identificar cuáles son relevantes según la pregunta del usuario. Úsala antes de filtrarDatos para saber qué tablas y columnas consultar.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                palabras_clave: {
                    type: SchemaType.STRING,
                    description: 'Palabras clave extraídas de la pregunta del usuario, separadas por coma. Ej: "red, cobertura, zona"',
                },
            },
            required: ['palabras_clave'],
        },
    },
    {
        name: 'filtrarDatos',
        description: 'Ejecuta una consulta SQL SELECT contra la base de datos para obtener datos reales. Úsala después de contextDB, usando las tablas y columnas que esa tool te devolvió.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: {
                    type: SchemaType.STRING,
                    description: 'Consulta SQL SELECT a ejecutar',
                },
            },
            required: ['query'],
        },
    },
];

function validateReadOnlyQuery(query: string): { valid: boolean; reason?: string } {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery.startsWith('select')) {
        return { valid: false, reason: 'Solo se permiten consultas SELECT.' };
    }

    const hasForbiddenWord = FORBIDDEN_SQL_WORDS.some((word) =>
        new RegExp(`\\b${word}\\b`).test(normalizedQuery),
    );

    if (hasForbiddenWord) {
        return { valid: false, reason: 'La consulta contiene operaciones no permitidas.' };
    }

    const statementCount = normalizedQuery
        .split(';')
        .filter((statement) => statement.trim().length > 0).length;

    if (statementCount > 1) {
        return { valid: false, reason: 'Solo se permite una sentencia SQL por consulta.' };
    }

    return { valid: true };
}

function applyRowLimit(query: string): string {
    const normalizedQuery = query.trim().replace(/;$/, '');

    if (/\blimit\b/i.test(normalizedQuery)) {
        return normalizedQuery;
    }

    return `${normalizedQuery} LIMIT ${MAX_QUERY_ROWS}`;
}

export async function executeContextDB(rawKeywords: string) {
    const keywords = rawKeywords
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

    const conditions = keywords
        .map((_, index) => `(conceptos::text ILIKE $${index + 1} OR sinonimos::text ILIKE $${index + 1})`)
        .join(' OR ');
    const values = keywords.map((keyword) => `%${keyword}%`);

    try {
        const result = await pool.query(
            `
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
                LIMIT ${MAX_CATALOG_RESULTS}
            `,
            values,
        );

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

export async function executeFiltrarDatos(rawQuery: string) {
    logger.info(`Tool filtrarDatos recibió: ${rawQuery}`);

    const validation = validateReadOnlyQuery(rawQuery);
    if (!validation.valid) {
        logger.error(`Query rechazada: ${validation.reason} | Query: ${rawQuery}`);

        return {
            ok: false,
            error: `Consulta rechazada: ${validation.reason}`,
            rows: [],
        };
    }

    const limitedQuery = applyRowLimit(rawQuery);

    try {
        const result = await pool.query(limitedQuery);

        logger.info(`Tool filtrarDatos: ${result.rows.length} filas devueltas`);

        return {
            ok: true,
            rows: result.rows,
            appliedQuery: limitedQuery,
            message: result.rows.length === 0 ? 'La consulta no devolvió resultados.' : undefined,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`Tool filtrarDatos falló: ${message} | Query: ${limitedQuery}`);

        return {
            ok: false,
            error: `Error al ejecutar la consulta: ${message}`,
            rows: [],
            appliedQuery: limitedQuery,
        };
    }
}
