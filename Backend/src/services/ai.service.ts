import { GoogleGenerativeAI } from '@google/generative-ai';
import { CONTEXTO_PROMPT } from '../prompts/contexto.prompt.js';
import logger from '../config/logger.js';
import type { DataResponse } from './data.service.js';

export interface AIServiceConfig {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    timeoutMs: number;
}

export class AIService {
    private readonly context = CONTEXTO_PROMPT;
    private readonly client: GoogleGenerativeAI;

    constructor(private readonly config: AIServiceConfig) {
        if (!config.apiKey) {
            throw new Error('AIService requires an apiKey to be configured.');
        }
        this.client = new GoogleGenerativeAI(config.apiKey);
    }

    async generate(input: string): Promise<DataResponse> {
        logger.info('AI generation started');

        try {
            const model = this.client.getGenerativeModel({
                model: this.config.model ?? 'gemini-2.5-flash',
            });

            const prompt = `${this.context}
                    Responde ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, sin texto adicional) con esta forma exacta:
                    {
                    "aiResponse": "string con la respuesta en lenguaje natural para el usuario",
                    "dataPoints": [
                        { "region": "string", "value": number, "source": "string" }
                    ],
                    "sources": ["string"]
                    }

                    Consulta del usuario: ${input}
            `;

            const result = await model.generateContent(prompt);
            const rawText = result.response.text();

            const parsed = this.parseResponse(rawText);

            logger.info(
                `AI generation completed with ${parsed.dataPoints.length} data points`,
            );

            return parsed;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            logger.error(`AI generation failed: ${message}`);
            throw new Error(`AI generation failed: ${message}`);
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
            logger.error('Failed to parse AI response as JSON, returning raw text fallback');
            return {
                aiResponse: rawText,
                dataPoints: [],
                sources: [],
            };
        }
    }
}