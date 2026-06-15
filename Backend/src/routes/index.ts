import { Router } from 'express';
import type { AppContainer } from '../container.js';
import { createHealthRoutes } from './health.routes.js';

export const createRoutes = (container: AppContainer) => {
    const router = Router();

    router.use('/health', createHealthRoutes(container));

    return router;
};
