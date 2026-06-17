import type { DataResponse } from './data.service.js';

export class AIService {
    private readonly context = 'TODO: Define the AI system context.';

    async generate(input: string): Promise<DataResponse> {
        void input;
        void this.context;
        //TODO: Implementar la generación de texto
        throw new Error('AI generation is not implemented yet.');
    }
}
