import logger from '../config/logger.js';
import type { DataResponse } from './data.service.js';

export interface AIServiceConfig {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    timeoutMs: number;
}

export class AIService {
    private readonly context = 'TODO: Define the AI system context.';

    constructor(private readonly config: AIServiceConfig) {}

    async generate(input: string): Promise<DataResponse> {
        logger.info('AI generation started');

        void input;
        void this.context;
        void this.config;

        //TODO: Implementar la generación de texto
        logger.error('AI generation failed because the provider is not implemented');
        throw new Error('AI generation is not implemented yet.');
    }
}
