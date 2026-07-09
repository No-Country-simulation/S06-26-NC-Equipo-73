import { server } from "../config/mcp.js";
import { pool } from "../config/db.js";
import { z } from 'zod';
import logger from '../config/logger.js';

const STOPWORDS = new Set([
    'a', 'al', 'como', 'con', 'cual', 'cuales', 'cuál', 'cuáles', 'de', 'del', 'el', 'en',
    'entre', 'es', 'hay', 'la', 'las', 'lo', 'los', 'para', 'por', 'que', 'qué', 'se', 'su',
    'sus', 'un', 'una', 'uno', 'unas', 'unos', 'y',
]);

type FuenteCatalogo = {
    esquema: string;
    nombre_tabla: string;
    tipo_tabla: string;
    dominio: string;
    descripcion: string;
    granularidad: string;
    fuente: string | null;
    cobertura: string | null;
};

type TablaDescripta = {
    esquema: string;
    nombre_tabla: string;
    tipo_tabla: string;
    dominio: string;
    subdominios: string[] | null;
    descripcion: string;
    granularidad: string;
    clave_territorial: string | null;
    columnas_temporales: unknown;
    columnas_relevantes: unknown;
    relaciones: unknown;
    fuente: string | null;
    cobertura: string | null;
    advertencias: string[] | null;
};

function normalizarTexto(texto: string): string {
    return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function extraerKeywords(palabrasClave: string): string[] {
    const compactas = palabrasClave
        .split(/[,\n;|]+/g)
        .flatMap((fragmento) => fragmento.split(/\s+/g))
        .map((keyword) => normalizarTexto(keyword))
        .map((keyword) => keyword.replace(/[^\p{L}\p{N}_-]/gu, ''))
        .filter((keyword) => keyword.length >= 3)
        .filter((keyword) => !STOPWORDS.has(keyword));

    const compuestas = palabrasClave
        .split(/[,\n;|]+/g)
        .map((fragmento) => normalizarTexto(fragmento))
        .map((fragmento) => fragmento.replace(/\s+/g, ' ').trim())
        .filter((fragmento) => fragmento.length >= 3);

    return Array.from(new Set([...compuestas, ...compactas]));
}

function calcularScore(fuente: FuenteCatalogo, keywords: string[]): number {
    const campos = [
        fuente.nombre_tabla,
        fuente.tipo_tabla,
        fuente.dominio,
        fuente.descripcion,
        fuente.granularidad,
        fuente.fuente ?? '',
        fuente.cobertura ?? '',
    ].map((campo) => normalizarTexto(campo));

    let score = 0;

    for (const keyword of keywords) {
        if (campos.some((campo) => campo.includes(keyword))) {
            score += keyword.includes(' ') ? 4 : 2;
        }
    }

    if (normalizarTexto(fuente.dominio) === 'telecomunicaciones' && keywords.some((keyword) => ['cobertura', 'red', 'conectividad', 'antenas'].includes(keyword))) {
        score += 3;
    }

    if (normalizarTexto(fuente.dominio) === 'salud' && keywords.some((keyword) => keyword.includes('salud') || keyword.includes('mental') || keyword.includes('hospital'))) {
        score += 3;
    }

    return score;
}

async function buscarFuentesCatalogo() {
    const query = `
        SELECT
            esquema,
            nombre_tabla,
            tipo_tabla,
            dominio,
            descripcion,
            granularidad,
            fuente,
            cobertura
        FROM public.listar_fuentes_datos()
    `;

    const result = await pool.query<FuenteCatalogo>(query);
    return result.rows;
}

async function describirTablas(tablas: string[]) {
    const query = `
        SELECT
            esquema,
            nombre_tabla,
            tipo_tabla,
            dominio,
            subdominios,
            descripcion,
            granularidad,
            clave_territorial,
            columnas_temporales,
            columnas_relevantes,
            relaciones,
            fuente,
            cobertura,
            advertencias
        FROM public.describir_tablas_datos($1::text[])
    `;

    const result = await pool.query<TablaDescripta>(query, [tablas]);
    return result.rows;
}

async function buscarTablasFallback(keywords: string[]) {
    const conditions = keywords.map((_, i) => `
        (
            nombre_tabla ILIKE $${i + 1}
            OR dominio ILIKE $${i + 1}
            OR descripcion ILIKE $${i + 1}
            OR cobertura ILIKE $${i + 1}
            OR conceptos::text ILIKE $${i + 1}
            OR sinonimos::text ILIKE $${i + 1}
            OR subdominios::text ILIKE $${i + 1}
        )
    `).join(' OR ');

    const values = keywords.map((keyword) => `%${keyword}%`);
    const query = `
        SELECT
            esquema,
            nombre_tabla,
            tipo_tabla,
            dominio,
            subdominios,
            descripcion,
            granularidad,
            clave_territorial,
            columnas_temporales,
            columnas_relevantes,
            relaciones,
            fuente,
            cobertura,
            advertencias,
            prioridad_busqueda
        FROM public.catalogo_tablas_datos
        WHERE habilitada_mcp = true
          AND (${conditions})
          AND to_regclass(format('%I.%I', esquema, nombre_tabla)) IS NOT NULL
        ORDER BY prioridad_busqueda DESC, nombre_tabla
        LIMIT 5
    `;

    const result = await pool.query(query, values);
    return result.rows;
}

export async function executeContextDB(palabras_clave: string) {
    try {
        const keywords = extraerKeywords(palabras_clave);

        if (keywords.length === 0) {
            return {
                ok: false,
                error: 'Debes indicar al menos una palabra clave para consultar el catálogo.',
                rows: [],
            };
        }

        try {
            const fuentes = await buscarFuentesCatalogo();
            const seleccionadas = fuentes
                .map((fuente) => ({
                    fuente,
                    score: calcularScore(fuente, keywords),
                }))
                .filter((item) => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map((item) => item.fuente.nombre_tabla);

            const rows = seleccionadas.length > 0 ? await describirTablas(seleccionadas) : [];

            return {
                ok: true,
                rows,
                keywords,
                message: rows.length === 0
                    ? 'No se encontraron tablas relacionadas con esas palabras clave.'
                    : undefined,
            };
        } catch (functionError) {
            const message = functionError instanceof Error ? functionError.message : String(functionError);
            logger.warn(`contextDB no pudo usar funciones del catálogo; se aplica fallback: ${message}`);
        }

        const rows = await buscarTablasFallback(keywords);

        return {
            ok: true,
            rows,
            keywords,
            message: rows.length === 0
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
