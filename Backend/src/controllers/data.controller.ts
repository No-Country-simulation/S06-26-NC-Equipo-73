import type { Request, Response } from 'express';
import { z } from 'zod';
import logger from '../config/logger.js';
import type { DataService } from '../services/data.service.js';

const dataRequestSchema = z.object({
    consulta: z.string().trim().min(1),
    filtros: z.object({
        region: z.string().trim().optional().default(''),
        indicador: z.string().trim().optional().default(''),
    }).optional().default(() => ({
        region: '',
        indicador: '',
    })),
    idioma: z.string().trim().min(1).default('es'),
}).transform(({ consulta, filtros, idioma }) => ({
    query: consulta,
    filters: {
        region: filtros.region ?? '',
        indicator: filtros.indicador ?? '',
    },
    language: idioma,
}));

export class DataController {
    constructor(private readonly dataService: DataService) {}

    queryData = async (req: Request, res: Response) => {
        const result = dataRequestSchema.safeParse(req.body);

        if (!result.success) {
            logger.warn('Data query rejected due to an invalid request');

            res.status(400).json({
                error: 'Solicitud inválida',
                detalles: result.error.flatten(),
            });
            return;
        }

        const response = await this.dataService.query(result.data);

        res.status(200).json(response);
    };
}
