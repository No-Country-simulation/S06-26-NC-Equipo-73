import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { CONTEXTO_PROMPT } from '../prompts/contexto.prompt.js';
import { pool } from '../config/db.js';
import type { DataResponse } from './data.service.js';
import logger from '../config/logger.js';

export interface AIServiceConfig {
    apiKey?: string;
    model?: string;
    timeoutMs: number;
}

export class AIService {
    private readonly AiContext = CONTEXTO_PROMPT;
    private readonly client: GoogleGenerativeAI;

    constructor(private readonly config: AIServiceConfig) {
        if (!config.apiKey) {
            throw new Error('AIService requiere una ApiKey para ser configurada.');
        }
        this.client = new GoogleGenerativeAI(config.apiKey);
    }

    async generate(input: string): Promise<DataResponse> {
        logger.info('Generación de la IA iniciada.');

        try {
            const model = this.client.getGenerativeModel({
                model: this.config.model ?? 'gemini-2.5-flash',
                tools: [{
                    functionDeclarations: [
                        {
                            name: 'contextDB',
                            description: 'Consulta el catálogo de tablas disponibles en la base de datos para identificar cuáles son relevantes según la pregunta del usuario. Úsala SIEMPRE PRIMERO antes de filtrarDatos para saber qué tablas y columnas consultar.',
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    palabras_clave: {
                                        type: SchemaType.STRING,
                                        description: 'Palabras clave extraídas de la pregunta del usuario, separadas por coma. Ej: "red, cobertura, zona"'
                                    }
                                },
                                required: ['palabras_clave']
                            }
                        },
                        {
                            name: 'filtrarDatos',
                            description: 'Ejecuta una consulta SQL SELECT contra la base de datos para obtener datos reales. Úsala SIEMPRE después de contextDB, usando las tablas y columnas que esa tool te devolvió.',
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    query: {
                                        type: SchemaType.STRING,
                                        description: 'Consulta SQL SELECT a ejecutar'
                                    }
                                },
                                required: ['query']
                            }
                        },
                    ]
                }]
            });

            const prompt = `${this.AiContext} 
                Consulta del usuario: ${input}
                Para responder consultas sobre datos:
                1. Usá PRIMERO contextDB con palabras clave de la pregunta
                2. Con las tablas y columnas que te devuelva, usá filtrarDatos para traer los datos reales
                3. Redactá la respuesta basándote únicamente en esos datos
            `
            const chat = model.startChat();
            const result = await chat.sendMessage(prompt);
            const response = result.response;

            console.log('Texto respuesta:', response.text());

            const functionCall = response.functionCalls()?.[0];

            if (functionCall && functionCall.name === 'contextDB') {
                const { palabras_clave } = functionCall.args as { palabras_clave: string };

                const keywords = palabras_clave.split(',').map(k => k.trim());
                const conditions = keywords.map((_, i) =>
                    `(conceptos::text ILIKE $${i + 1} OR sinonimos::text ILIKE $${i + 1})`
                ).join(' OR ');
                const values = keywords.map(k => `%${k}%`);

                const catalogoResult = await pool.query(`
                        SELECT nombre_tabla, descripcion, columnas_relevantes, relaciones
                        FROM "catalogo_tablas_datos"
                        WHERE habilitada_mcp = true AND (${conditions})
                        ORDER BY prioridad_busqueda ASC
                        LIMIT 5
                    `, values);

                const result2 = await chat.sendMessage([{
                    functionResponse: {
                        name: 'contextDB',
                        response: { result: JSON.stringify(catalogoResult.rows) }
                    }
                }]);

                const functionCall2 = result2.response.functionCalls()?.[0];

                if (functionCall2 && functionCall2.name === 'filtrarDatos') {
                    const { query } = functionCall2.args as { query: string };
                    const queryResult = await pool.query(query);

                    await chat.sendMessage([{
                        functionResponse: {
                            name: 'filtrarDatos',
                            response: { result: JSON.stringify(queryResult.rows) }
                        }
                    }]);

                    const finalResult = await chat.sendMessage(
                        `Responde ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, sin texto adicional) con esta forma exacta:
                        {
                            "aiResponse": "string con la respuesta en lenguaje natural para el usuario",
                            "dataPoints": [{ "region": "string", "value": number, "source": "string" }],
                            "sources": ["string"]
                        }
                     `
                    );

                    const parsed = this.parseResponse(finalResult.response.text());
                    logger.info(`Generación de la IA completada con ${parsed.dataPoints.length} puntos de datos.`);
                    return parsed;
                }
            }
            const parsed = this.parseResponse(response.text());
            logger.info(`Generación de la IA completada con ${parsed.dataPoints.length} puntos de datos.`);
            return parsed;

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Generación de la IA fallida: ${message}`);
            throw new Error(`Generación de la IA fallida: ${message}`);
        }
    }

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