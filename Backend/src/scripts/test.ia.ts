import 'dotenv/config'
import { AIService } from '../services/ai.service.js';

const probar = async () => {
    const aiService = new AIService({
        apiKey: process.env.AI_API_KEY,
        model: 'gemini-3.1-flash-lite',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        timeoutMs: 10000,
    });

    const respuesta = await aiService.generate('Tenes conocimiento de la zona de florianopolis?');
    console.log(respuesta);
};

probar();