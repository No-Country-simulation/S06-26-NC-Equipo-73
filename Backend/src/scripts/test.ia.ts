import 'dotenv/config'
import { AIService } from '../services/ai.service.js';

const probar = async () => {
    const aiService = new AIService({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-2.5-flash',
        timeoutMs: 10000,
    });

    const respuesta = await aiService.generate('¿Dónde hay concentración de personas pero cobertura de red precaria?');
    console.log(respuesta);
};

probar();