import { Router } from 'express';
import type { AppContainer } from '../container.js';

export const createMapRoutes = (container: AppContainer) => {
    const router = Router();

    /**
     * @openapi
     * /api/mapa:
     *   get:
     *     summary: Obtiene las regiones y sus indicadores para el mapa
     *     operationId: getMap
     *     tags:
     *       - Mapa
     *     responses:
     *       200:
     *         description: Regiones disponibles para el mapa
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MapResponse'
     */
    router.get('/', container.mapController.getMap);

    return router;
};
