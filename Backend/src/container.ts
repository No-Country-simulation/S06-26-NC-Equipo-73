import { DataController } from './controllers/data.controller.js';
import { HealthController } from './controllers/health.controller.js';
import { MapController } from './controllers/map.controller.js';
import { env } from './config/env.js';
import { AIService } from './services/ai.service.js';
import { DataService } from './services/data.service.js';
import { HealthService } from './services/health.service.js';
import { MapService } from './services/map.service.js';
import { MapRepository } from './repositories/map.repository.js';
import { TelecommunicationsIndicatorProvider } from './services/map-indicators/telecommunications.provider.js';
import { HealthIndicatorProvider } from './services/map-indicators/health.provider.js';
import { EmploymentIndicatorProvider } from './services/map-indicators/employment.provider.js';

export const createContainer = async () => {
    const healthService = new HealthService();
    const aiService = new AIService({
        ...(env.AI_API_KEY && { apiKey: env.AI_API_KEY }),
        ...(env.AI_MODEL && { model: env.AI_MODEL }),
        timeoutMs: env.AI_TIMEOUT_MS,
    });
    const dataService = new DataService(aiService);
    const mapRepository = new MapRepository();
    const mapService = new MapService(mapRepository, [
        new TelecommunicationsIndicatorProvider(),
        new HealthIndicatorProvider(),
        new EmploymentIndicatorProvider(),
    ]);

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
