import OpenAI from 'openai';
import { CONTEXTO_PROMPT } from '../prompts/contexto.prompt.js';
import { pool } from '../config/db.js';
import type { DataResponse } from './data.service.js';
import logger from '../config/logger.js';

export interface AIServiceConfig {
    apiKey?: string;
    model?: string;
    baseURL: string;
    timeoutMs: number;
};

interface CatalogoRow {
    nombre_tabla: string;
    descripcion: string;
    columnas_relevantes: { columna: string }[];
    relaciones: { tabla: string }[];
};

export class AIService {
    private readonly AiContext = CONTEXTO_PROMPT;
    private readonly client: OpenAI;

    constructor(private readonly config: AIServiceConfig) {
        if (!config.apiKey) {
            throw new Error('AIService requiere una ApiKey para ser configurada.');
        }
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL
        });
    }

    async generate(input: string): Promise<DataResponse> {
        logger.info('Generación de la IA iniciada.');

        const prompt = `${this.AiContext} 
                Consulta del usuario: ${input}
                Para responder consultas sobre datos:
                1. Usá PRIMERO contextDB con palabras clave de la pregunta
                2. Con las tablas y columnas que te devuelva, usá filtrarDatos para traer los datos reales
                3. Redactá la respuesta basándote únicamente en esos datos
            `
        try {
            const tools: OpenAI.Chat.ChatCompletionTool[] = [
                {
                    type: 'function',
                    function: {
                        name: 'contextDB',
                        description: 'Consulta el catálogo de tablas disponibles en la base de datos para identificar cuáles son relevantes según la pregunta del usuario. Úsala SIEMPRE PRIMERO antes de filtrarDatos para saber qué tablas y columnas consultar.',
                        parameters: {
                            type: 'object',
                            properties: {
                                palabras_clave: {
                                    type: 'string',
                                    description: 'Palabras clave extraídas de la pregunta del usuario, separadas por coma. Ej: "red, cobertura, zona"'
                                }
                            },
                            required: ['palabras_clave']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'filtrarDatos',
                        description: 'Ejecuta una consulta SQL SELECT contra la base de datos para obtener datos reales. Úsala SIEMPRE después de contextDB, usando las tablas y columnas que esa tool te devolvió.',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: 'Consulta SQL SELECT a ejecutar'
                                }
                            },
                            required: ['query']
                        }
                    }
                }
            ];

            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'user', content: prompt }
            ];

            const response = await this.client.chat.completions.create({
                model: this.config.model ?? 'gemini-3.1-flash-lite',
                messages,
                tools
            });

            const choice = response.choices[0];
            if (!choice) throw new Error('No se recibió respuesta de la IA');
            const message = choice.message;
            const toolCall = message.tool_calls?.find(tc => tc.type === 'function');

            console.log('Tool call:', toolCall);

            if (toolCall && toolCall.function.name === 'contextDB') {
                const { palabras_clave } = JSON.parse(toolCall.function.arguments) as { palabras_clave: string };

                const keywords = palabras_clave.split(',').map(k => k.trim());
                const conditions = keywords.map((_, i) =>
                    `(conceptos::text ILIKE $${i + 1} OR sinonimos::text ILIKE $${i + 1})`
                ).join(' OR ');
                const values = keywords.map(k => `%${k}%`);

                const catalogoResult = await pool.query(`
                     SELECT 
                        nombre_tabla,
                        descripcion,
                        columnas_relevantes,
                        relaciones
                    FROM "catalogo_tablas_datos"
                    WHERE habilitada_mcp = true AND (${conditions})
                    ORDER BY prioridad_busqueda ASC
                    LIMIT 3
                `, values);

                const catalogoSimplificado = catalogoResult.rows.map((row: CatalogoRow) => ({
                    nombre_tabla: row.nombre_tabla,
                    descripcion: row.descripcion,
                    columnas: Array.isArray(row.columnas_relevantes)
                        ? row.columnas_relevantes.map((c: { columna: string }) => c.columna).join(', ')
                        : '',
                    relaciones: Array.isArray(row.relaciones)
                        ? row.relaciones.map((r: { tabla: string }) => r.tabla).join(', ')
                        : ''
                }));

                console.log('Resultado catálogo:', catalogoSimplificado);

                messages.push({
                    role: 'assistant',
                    tool_calls: message.tool_calls
                        ?.filter(tc => tc.type === 'function')
                        .map(tc => {
                            if (tc.type !== 'function') return tc;
                            return {
                                id: tc.id,
                                type: 'function' as const,
                                function: {
                                    name: tc.function.name,
                                    arguments: tc.function.arguments
                                }
                            };
                        })
                });
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(catalogoSimplificado)
                });

                console.log('Messages antes del turno 2:', JSON.stringify(messages, null, 2));
                const response2 = await this.client.chat.completions.create({
                    model: this.config.model ?? 'gemini-3.1-flash-lite',
                    messages,
                    tools
                });

                const choice2 = response2.choices[0];
                if (!choice2) throw new Error('No se recibió respuesta de la IA');
                const message2 = choice2.message;
                const toolCall2 = message.tool_calls?.find(tc => tc.type === 'function');

                console.log('Respuesta turno 2:', message2.content);
                console.log('Tool call 2:', toolCall2);

                if (toolCall2 && toolCall2.function.name === 'filtrarDatos') {
                    const { query } = JSON.parse(toolCall2.function.arguments) as { query: string };
                    const queryResult = await pool.query(query);

                    messages.push({
                        role: 'assistant',
                        tool_calls: message2.tool_calls
                            ?.filter(tc => tc.type === 'function')
                            .map(tc => {
                                if (tc.type !== 'function') return tc;
                                return {
                                    id: tc.id,
                                    type: 'function' as const,
                                    function: {
                                        name: tc.function.name,
                                        arguments: tc.function.arguments
                                    }
                                };
                            })
                    });
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall2.id,
                        content: JSON.stringify(queryResult.rows)
                    });

                    const finalResponse = await this.client.chat.completions.create({
                        model: this.config.model ?? 'gemini-3.1-flash-lite',
                        messages: [...messages, {
                            role: 'user',
                            content: `Respond ONLY with valid JSON (no markdown, no \`\`\`json, no additional text) in this exact format.
                    IMPORTANT: The "aiResponse" field MUST be written in the same language the user used in their original query.
                    {
                        "aiResponse": "natural language response for the user",
                        "dataPoints": [{ "region": "string", "value": number, "source": "string" }],
                        "sources": ["string"]
                    }`
                        }]
                    });

                    const choiceFinal = finalResponse.choices[0];
                    if (!choiceFinal) throw new Error('No se recibió respuesta final de la IA');
                    const rawText = choiceFinal.message.content ?? '';
                    const parsed = this.parseResponse(rawText);
                    logger.info(`Generación de la IA completada con ${parsed.dataPoints.length} puntos de datos.`);
                    return parsed;
                }
                const rawText2 = message2.content ?? '';
                const parsed2 = this.parseResponse(rawText2);
                logger.info(`Generación de la IA completada con ${parsed2.dataPoints.length} puntos de datos.`);
                return parsed2;
            }

            const rawText = message.content ?? '';
            const parsed = this.parseResponse(rawText);
            logger.info(`Generación de la IA completada con ${parsed.dataPoints.length} puntos de datos.`);
            return parsed;

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Generación de la IA fallida: ${message}`);
            throw new Error(`Generación de la IA fallida: ${message}`);
        }
    };

    private parseResponse(rawText: string): DataResponse {
        try {
            const cleaned = rawText.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleaned) as DataResponse;

            return {
                aiResponse: data.aiResponse ?? '',
                dataPoints: data.dataPoints ?? [],
                sources: data.sources ?? [],
            };
        } catch (error) {
            logger.error('No se pudo analizar la respuesta de la IA como JSON; se devuelve texto sin formato como alternativa.');
            return {
                aiResponse: rawText,
                dataPoints: [],
                sources: [],
            };
        }
    }
}