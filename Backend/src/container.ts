import { DataController } from './controllers/data.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { MapController } from './controllers/map.controller.js';
import { env } from './config/env.js';
import { AIService } from './services/ai.service.js';
import { DataService } from './services/data.service.js';
import { HealthService } from './services/health.service.js';
import { MapService } from './services/map.service.js';

export const createContainer = async () => {
    const healthService = new HealthService();
    const aiService = new AIService({
        ...(env.AI_API_KEY && { apiKey: env.AI_API_KEY }),
        ...(env.AI_MODEL && { model: env.AI_MODEL }),
        timeoutMs: env.AI_TIMEOUT_MS,
    });
    const dataService = new DataService(aiService);
    const mapService = new MapService();

    const healthController = new HealthController(healthService);
    const dataController = new DataController(dataService);
    const mapController = new MapController(mapService);

    return {
        healthController,
        aiService,
        dataController,
        mapController,
    };
};

export type AppContainer = Awaited<ReturnType<typeof createContainer>>;
