import { HealthController } from './controllers/health.controller.js';
import { HealthService } from './services/health.service.js';

export const createContainer = async () => {
    const healthService = new HealthService();
    const healthController = new HealthController(healthService);

    return {
        healthController,
    };
};

export type AppContainer = Awaited<ReturnType<typeof createContainer>>;
