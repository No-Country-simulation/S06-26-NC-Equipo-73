import type { Request, Response } from 'express';
import { z } from 'zod';
import logger from '../config/logger.js';
import type { IndicatorDomain } from '../services/map-indicators/indicator-provider.js';
import type { MapQuery, MapService } from '../services/map.service.js';

const normalizeList = (value: unknown): unknown => {
    if (value === undefined) return undefined;
    const values = Array.isArray(value) ? value : [value];
    if (!values.every((item) => typeof item === 'string')) return value;
    return values.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean);
};

const isCalendarDate = (value: string): boolean => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const mapQuerySchema = z.object({
    region: z.string().trim().min(1).max(100).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isCalendarDate, 'Fecha inválida').optional(),
    period: z.string().trim().min(1).max(50).transform((value) => value.toUpperCase()).optional(),
    indicators: z.preprocess(normalizeList, z.array(z.string().trim().min(1).max(100)).min(1).optional()),
    domains: z.preprocess(
        normalizeList,
        z.array(z.enum(['telecommunications', 'health', 'employment'])).min(1).optional(),
    ),
});

export class MapController {
    constructor(private readonly mapService: MapService) {}

    getIndicators = (_req: Request, res: Response) => {
        res.status(200).json({ indicators: this.mapService.getIndicatorCatalog() });
    };

    getMap = async (req: Request, res: Response) => {
        const result = mapQuerySchema.safeParse(req.query);

        if (!result.success) {
            logger.warn('Map query rejected due to invalid filters');
            res.status(400).json({
                error: 'Parámetros de consulta inválidos',
                details: result.error.flatten(),
            });
            return;
        }

        const domains = (result.data.domains ?? []) as IndicatorDomain[];
        const selection = this.mapService.resolveIndicatorCodes(result.data.indicators, domains);
        if (selection.unknown.length > 0 || selection.codes.length === 0) {
            res.status(400).json({
                error: 'Indicadores desconocidos o incompatibles con los dominios solicitados',
                unknownIndicators: selection.unknown,
                availableIndicators: this.mapService.getIndicatorCatalog(),
            });
            return;
        }

        const query: MapQuery = {
            indicators: selection.codes,
            ...(result.data.region ? { region: result.data.region } : {}),
            ...(result.data.date ? { date: result.data.date } : {}),
            ...(result.data.period ? { period: result.data.period } : {}),
        };

        res.status(200).json(await this.mapService.getRegions(query));
    };
}
