import { GoogleGenerativeAI } from '@google/generative-ai';
import { CONTEXTO_PROMPT } from '../prompts/contexto.prompt.js';
import type { DataQuery, DataResponse } from './data.service.js';
import logger from '../config/logger.js';
import {
    AI_TOOL_DECLARATIONS,
    executeContextDB,
    executeFiltrarDatos,
} from '../tools/tool-executors.js';

export interface AIServiceConfig {
    apiKey?: string;
    model?: string;
    timeoutMs: number;
}

export class AIService {
    private readonly AiContext = CONTEXTO_PROMPT;
    private readonly client: GoogleGenerativeAI;
    private readonly maxToolIterations = 6;

    constructor(private readonly config: AIServiceConfig) {
        if (!config.apiKey) {
            throw new Error('AIService requiere una ApiKey para ser configurada.');
        }
        this.client = new GoogleGenerativeAI(config.apiKey);
    }

    async generate(input: DataQuery): Promise<DataResponse> {
        logger.info('Generación de la IA iniciada.');

        try {
            const model = this.client.getGenerativeModel({
                model: this.config.model ?? 'gemini-2.5-flash',
                tools: [{
                    functionDeclarations: AI_TOOL_DECLARATIONS,
                }]
            });

            const prompt = this.buildPrompt(input);
            const chat = model.startChat();
            let result = await chat.sendMessage(prompt);

            for (let iteration = 0; iteration < this.maxToolIterations; iteration += 1) {
                const functionCalls = result.response.functionCalls() ?? [];

                if (functionCalls.length === 0) {
                    const parsed = this.parseResponse(result.response.text());
                    logger.info(`Generación de la IA completada con ${parsed.dataPoints.length} puntos de datos.`);
                    return parsed;
                }

                logger.info(`La IA solicitó ${functionCalls.length} tool call(s) en la iteración ${iteration + 1}.`);

                const functionResponses = await Promise.all(
                    functionCalls.map(async (functionCall) => ({
                        functionResponse: {
                            name: functionCall.name,
                            response: {
                                result: JSON.stringify(await this.executeToolCall(functionCall.name, functionCall.args)),
                            },
                        },
                    })),
                );

                result = await chat.sendMessage(functionResponses);
            }

            throw new Error('La IA no produjo una respuesta final luego del máximo de tool calls permitidas.');

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`Generación de la IA fallida: ${message}`);
            throw new Error(`Generación de la IA fallida: ${message}`);
        }
    }

    private buildPrompt(input: DataQuery): string {
        const filters = [
            input.filters.region ? `- Región sugerida: ${input.filters.region}` : '',
            input.filters.indicator ? `- Indicador sugerido: ${input.filters.indicator}` : '',
            input.language ? `- Idioma de salida: ${input.language}` : '',
        ].filter(Boolean).join('\n');

        return `${this.AiContext}
Consulta del usuario: ${input.query}
${filters ? `Contexto adicional:\n${filters}\n` : ''}
Instrucciones:
1. Usa contextDB antes de consultar datos si necesitas ubicar tablas o columnas.
2. Usa filtrarDatos para obtener datos reales desde la base.
3. Si usas tools, puedes hacer varias iteraciones hasta tener suficiente contexto.
4. Responde SOLO con JSON válido, sin markdown ni texto extra, usando exactamente este formato:
{
  "aiResponse": "respuesta natural para el usuario",
  "dataPoints": [{ "region": "string", "value": number, "source": "string" }],
  "sources": ["string"]
}
5. El campo "aiResponse" debe estar en el mismo idioma de la consulta del usuario.
6. Basa tu respuesta únicamente en los datos obtenidos por tools.`;
    }

    private async executeToolCall(name: string, args: unknown) {
        switch (name) {
            case 'contextDB': {
                const { palabras_clave } = (args ?? {}) as { palabras_clave?: string };
                return executeContextDB(palabras_clave ?? '');
            }
            case 'filtrarDatos': {
                const { query } = (args ?? {}) as { query?: string };
                return executeFiltrarDatos(query ?? '');
            }
            default:
                throw new Error(`Tool desconocida solicitada por la IA: ${name}`);
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
