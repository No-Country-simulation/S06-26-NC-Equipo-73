import { Router } from 'express';
import type { AppContainer } from '../container.js';
import { createDataRoutes } from './data.routes.js';
import { createHealthRoutes } from './health.routes.js';
import { createMapRoutes } from './map.routes.js';

/**
 * @openapi
 * components:
 *   schemas:
 *     HealthResponse:
 *       type: object
 *       required: [status, uptime, timestamp]
 *       properties:
 *         status:
 *           type: string
 *           example: ok
 *         uptime:
 *           type: number
 *           example: 12.34
 *         timestamp:
 *           type: string
 *           format: date-time
 *     DataFilters:
 *       type: object
 *       required: [region, indicador]
 *       properties:
 *         region:
 *           type: string
 *           example: Metropolitana
 *         indicador:
 *           type: string
 *           example: cobertura_red
 *     DataRequest:
 *       type: object
 *       required: [consulta, filtros, idioma]
 *       properties:
 *         consulta:
 *           type: string
 *           example: ¿Cuál es la cobertura de red en la región?
 *         filtros:
 *           $ref: '#/components/schemas/DataFilters'
 *         idioma:
 *           type: string
 *           example: es
 *     DataPoint:
 *       type: object
 *       required: [region, value, source]
 *       properties:
 *         region:
 *           type: string
 *           example: Metropolitana
 *         value:
 *           type: number
 *           example: 82.5
 *         source:
 *           type: string
 *           example: Ministerio de Telecomunicaciones
 *     DataResponse:
 *       type: object
 *       required: [aiResponse, dataPoints, sources]
 *       properties:
 *         aiResponse:
 *           type: string
 *           example: La cobertura de red de la región es de 82.5%.
 *         dataPoints:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DataPoint'
 *         sources:
 *           type: array
 *           items:
 *             type: string
 *     MapRegion:
 *       type: object
 *       required:
 *         - region
 *         - lat
 *         - lng
 *         - concentration
 *         - networkCoverage
 *         - indicators
 *       properties:
 *         region:
 *           type: string
 *           example: Metropolitana
 *         lat:
 *           type: number
 *           format: double
 *           example: -33.4489
 *         lng:
 *           type: number
 *           format: double
 *           example: -70.6693
 *         concentration:
 *           type: number
 *           example: 75
 *         networkCoverage:
 *           type: number
 *           example: 82.5
 *         indicators:
 *           type: array
 *           items:
 *             type: string
 *     MapResponse:
 *       type: object
 *       required: [regions]
 *       properties:
 *         regions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MapRegion'
 *     ValidationErrorDetails:
 *       type: object
 *       required: [formErrors, fieldErrors]
 *       properties:
 *         formErrors:
 *           type: array
 *           items:
 *             type: string
 *         fieldErrors:
 *           type: object
 *           additionalProperties:
 *             type: array
 *             items:
 *               type: string
 *     ValidationErrorResponse:
 *       type: object
 *       required: [error, detalles]
 *       properties:
 *         error:
 *           type: string
 *           example: Solicitud inválida
 *         detalles:
 *           $ref: '#/components/schemas/ValidationErrorDetails'
 */
export const createRoutes = (container: AppContainer) => {
    const router = Router();

    router.use('/health', createHealthRoutes(container));
    router.use('/datos', createDataRoutes(container));
    router.use('/mapa', createMapRoutes(container));

    return router;
};
