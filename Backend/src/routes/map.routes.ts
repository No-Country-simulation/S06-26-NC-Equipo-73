import { Router } from 'express';
import type { AppContainer } from '../container.js';

export const createMapRoutes = (container: AppContainer) => {
    const router = Router();

    /**
     * @openapi
     * /api/mapa/indicadores:
     *   get:
     *     summary: Obtiene el catálogo de indicadores disponibles
     *     operationId: getMapIndicators
     *     tags: [Mapa]
     *     responses:
     *       200:
     *         description: Catálogo de indicadores por dominio
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/IndicatorCatalogResponse'
     */
    router.get('/indicadores', container.mapController.getIndicators);

    /**
     * @openapi
     * /api/mapa:
     *   get:
     *     summary: Obtiene municipios y sus indicadores para el mapa
     *     operationId: getMap
     *     tags:
     *       - Mapa
     *     parameters:
     *       - in: query
     *         name: region
     *         schema:
     *           type: string
     *         description: Nombre exacto de la zona, sin distinguir mayúsculas
     *       - in: query
     *         name: date
     *         schema:
     *           type: string
     *           format: date
     *         description: Fecha de observación. Si se omite se usa la fecha más reciente disponible
     *       - in: query
     *         name: period
     *         schema:
     *           type: string
     *         description: Periodo cargado en el tensor, por ejemplo MANHA
     *       - in: query
     *         name: indicators
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *         style: form
     *         explode: false
     *         description: Indicadores separados por coma. Si se omite se devuelven todos
     *       - in: query
     *         name: domains
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *             enum: [telecommunications, health, employment]
     *         style: form
     *         explode: false
     *         description: Limita la respuesta a uno o más dominios
     *     responses:
     *       200:
     *         description: Municipios disponibles para el mapa
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MapResponse'
     *       400:
     *         description: Parámetros de consulta inválidos
     */
    router.get('/', container.mapController.getMap);

    return router;
};
