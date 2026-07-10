import OpenAI from 'openai';
import type {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageFunctionToolCall,
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCall,
    ChatCompletionTool,
    ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions';
import { CONTEXTO_PROMPT } from '../prompts/contexto.prompt.js';
import type { DataQuery, DataResponse } from './data.service.js';
import logger from '../config/logger.js';
import { executeContextDB } from '../tools/contextBD.tool.js';
import { executeFiltrarDatos } from '../tools/filtrarDatos.tool.js';

export interface AIServiceConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    timeoutMs: number;
}

export class AIService {
    private readonly aiContext = CONTEXTO_PROMPT;
    private readonly client: OpenAI;
    private readonly maxToolIterations = 6;
    private readonly tools: ChatCompletionTool[] = [
        {
            type: 'function',
            function: {
                name: 'contextDB',
                description:
                    'Consulta el catálogo de tablas disponibles en la base de datos para identificar cuáles son relevantes según la pregunta del usuario. Úsala SIEMPRE PRIMERO antes de filtrarDatos para saber qué tablas y columnas consultar.',
                parameters: {
                    type: 'object',
                    properties: {
                        palabras_clave: {
                            type: 'string',
                            description:
                                'Palabras clave extraídas de la pregunta del usuario, separadas por coma. Ej: "red, cobertura, zona"',
                        },
                    },
                    required: ['palabras_clave'],
                    additionalProperties: false,
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'filtrarDatos',
                description:
                    'Ejecuta una consulta SQL SELECT contra la base de datos para obtener datos reales. Úsala SIEMPRE después de contextDB, usando las tablas y columnas que esa tool te devolvió.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Consulta SQL SELECT a ejecutar',
                        },
                    },
                    required: ['query'],
                    additionalProperties: false,
                },
            },
        },
    ];

    constructor(private readonly config: AIServiceConfig) {
        if (!config.apiKey) {
            throw new Error('AIService requiere una ApiKey para ser configurada.');
        }
        this.client = new OpenAI({
            apiKey: config.apiKey,
            ...(config.baseUrl && { baseURL: config.baseUrl }),
        });
    }

    async generate(input: DataQuery): Promise<DataResponse> {
        logger.info('Generación de la IA iniciada.');

        try {
            const messages = this.buildMessages(input);
            let forceFinalResponse = false;

            for (let iteration = 0; iteration < this.maxToolIterations; iteration += 1) {
                logger.info(
                    `Solicitando completion al proveedor de IA. Iteración=${iteration + 1}, modelo=${this.config.model ?? 'gpt-4o-mini'}, mensajes=${messages.length}, toolsHabilitadas=${forceFinalResponse ? 'no' : 'si'}.`,
                );

                const result = await this.createChatCompletion(messages, { enableTools: !forceFinalResponse });
                const message = result.choices[0]?.message;

                if (!message) {
                    throw new Error('La IA no devolvió un mensaje en la respuesta.');
                }

                const toolCalls = this.getFunctionToolCalls(message.tool_calls);

                if (toolCalls.length === 0) {
                    const parsed = this.parseResponse(this.extractMessageText(message.content));
                    logger.info(`Generación de la IA completada con ${parsed.dataPoints.length} puntos de datos.`);
                    return parsed;
                }

                logger.info(`La IA solicitó ${toolCalls.length} tool call(s) en la iteración ${iteration + 1}.`);

                messages.push(this.createAssistantToolCallMessage(toolCalls));

                const toolResponses = await Promise.all(
                    toolCalls.map(async (toolCall) =>
                        this.createToolMessage(toolCall, await this.executeToolCall(toolCall.function.name, toolCall.function.arguments)),
                    ),
                );

                messages.push(...toolResponses);
                forceFinalResponse = toolCalls.some((toolCall) => toolCall.function.name === 'filtrarDatos');
            }

            throw new Error('La IA no produjo una respuesta final luego del máximo de tool calls permitidas.');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(error);
            throw new Error(`Generación de la IA fallida: ${message}`);
        }
    }

    private buildMessages(input: DataQuery): ChatCompletionMessageParam[] {
        const filters = [
            input.filters.region ? `- Región sugerida: ${input.filters.region}` : '',
            input.filters.indicator ? `- Indicador sugerido: ${input.filters.indicator}` : '',
            input.language ? `- Idioma de salida: ${input.language}` : '',
        ].filter(Boolean).join('\n');

        return [
            {
                role: 'system',
                content: `${this.aiContext}
Instrucciones:
1. Usa contextDB SIEMPRE primero para descubrir qué tablas y columnas están disponibles para esta consulta.
2. Usa únicamente las tablas y columnas que contextDB haya confirmado.
3. Usa filtrarDatos para obtener datos reales desde la base.
4. Si contextDB devuelve tablas de más de un dominio, considera relaciones territoriales para cruzarlas correctamente.
5. Si una relación no puede sostenerse con los datos devueltos por contextDB, dilo explícitamente en vez de inventarla.
6. Si usas tools, puedes hacer varias iteraciones hasta tener suficiente contexto.
7. Cuando ya no necesites usar más tools y tengas suficiente contexto para responder, devuelve JSON válido, sin markdown ni texto extra, usando exactamente este formato:
{
  "aiResponse": "respuesta natural para el usuario",
  "dataPoints": [{ "region": "string", "value": number, "source": "string" }],
  "sources": ["string"]
}
8. El campo "aiResponse" debe estar en el mismo idioma de la consulta del usuario.
9. Basa tu respuesta únicamente en los datos obtenidos por tools.`,
            },
            {
                role: 'user',
                content: `Consulta del usuario: ${input.query}
${filters ? `Contexto adicional:\n${filters}` : ''}`.trim(),
            },
        ];
    }

    private async createChatCompletion(
        messages: ChatCompletionMessageParam[],
        options?: { enableTools?: boolean },
    ) {
        const enableTools = options?.enableTools ?? true;

        return this.withTimeout((signal) =>
            this.client.chat.completions.create(
                {
                    model: this.config.model ?? 'gpt-4o-mini',
                    messages,
                    ...(enableTools
                        ? {
                            tools: this.tools,
                            tool_choice: 'auto' as const,
                        }
                        : {
                            tool_choice: 'none' as const,
                        }),
                },
                { signal },
            ),
        );
    }

    private createAssistantToolCallMessage(
        toolCalls: ChatCompletionMessageFunctionToolCall[] | undefined,
    ): ChatCompletionAssistantMessageParam {
        if (!toolCalls || toolCalls.length === 0) {
            throw new Error('Se intentó crear un mensaje de assistant sin tool calls.');
        }

        return {
            role: 'assistant',
            content: null,
            tool_calls: toolCalls,
        };
    }

    private getFunctionToolCalls(
        toolCalls: ChatCompletionMessageToolCall[] | undefined,
    ): ChatCompletionMessageFunctionToolCall[] {
        return (toolCalls ?? []).filter(
            (toolCall): toolCall is ChatCompletionMessageFunctionToolCall => toolCall.type === 'function',
        );
    }

    private async createToolMessage(
        toolCall: ChatCompletionMessageFunctionToolCall,
        toolResult: unknown,
    ): Promise<ChatCompletionToolMessageParam> {
        return {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
        };
    }

    private async executeToolCall(name: string, rawArgs: string) {
        const args = this.parseToolArguments(rawArgs);

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

    private parseToolArguments(rawArgs: string): Record<string, unknown> {
        try {
            return JSON.parse(rawArgs) as Record<string, unknown>;
        } catch (error) {
            throw new Error(
                `No se pudieron analizar los argumentos de la tool como JSON: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    private extractMessageText(content: string | Array<{ type: string; text?: string }> | null): string {
        if (typeof content === 'string') {
            return content;
        }

        if (Array.isArray(content)) {
            return content
                .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && typeof part.text === 'string')
                .map((part) => part.text)
                .join('\n');
        }

        return '';
    }

    private async withTimeout<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

        try {
            return await operation(controller.signal);
        } finally {
            clearTimeout(timeout);
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
