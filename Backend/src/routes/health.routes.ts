import { Router } from 'express';
import type { AppContainer } from '../container.js';

export const createHealthRoutes = (container: AppContainer) => {
    const router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Verifica el estado del backend
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Backend operativo
 */
    router.get('/', container.healthController.getHealth);

    return router;
};
