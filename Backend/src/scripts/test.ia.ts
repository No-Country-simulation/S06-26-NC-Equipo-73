import 'dotenv/config'
import { AIService } from '../services/ai.service.js';

const probar = async () => {
    const aiService = new AIService({
        apiKey: process.env.AI_API_KEY,
        model: 'gemini-2.5-flash',
        timeoutMs: 10000,
    });

    const respuesta = await aiService.generate('¿Cuáles son las zonas con mayor concentración de usuarios y peor cobertura de red?');
    console.log(respuesta);
};

probar();