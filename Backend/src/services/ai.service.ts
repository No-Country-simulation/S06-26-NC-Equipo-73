import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { CONTEXTO_PROMPT } from '../prompts/contexto.prompt.js';
import { DB_SCHEMA_CONTEXT } from '../prompts/bdContext.prompt.js';
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
    private readonly dbContext = DB_SCHEMA_CONTEXT;
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
                    functionDeclarations: [{
                        name: 'filtrarDatos',
                        description: 'Ejecuta una consulta SQL SELECT contra la base de datos para obtener datos reales.',
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
                    }]
                }]
            });

            const prompt = `${this.AiContext} ${this.dbContext}
                Consulta del usuario: ${input}
                Usa la tool filtrarDatos para obtener los datos reales de la base de datos antes de responder.
            `
            const chat = model.startChat();
            const result = await chat.sendMessage(prompt);
            const response = result.response;

            const functionCall = response.functionCalls()?.[0];

            if (functionCall && functionCall.name === 'filtrarDatos') {
                const { query } = functionCall.args as { query: string };
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
                        }`
                );

                const parsed = this.parseResponse(finalResult.response.text());
                logger.info(`Generación de la IA completada con ${parsed.dataPoints.length} puntos de datos.`);
                return parsed;
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