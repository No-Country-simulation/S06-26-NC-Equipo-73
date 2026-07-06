import type { Request, Response } from 'express';
import type { MapService } from '../services/map.service.js';

export class MapController {
    constructor(private readonly mapService: MapService) {}

    getMap = (_req: Request, res: Response) => {
        res.status(200).json(this.mapService.getRegions());
    };
}
