import logger from '../config/logger.js';
import type { MapRepository } from '../repositories/map.repository.js';

export interface MapRegion {
    region: string;
    lat: number;
    lng: number;
    concentration: number;
    networkCoverage: number;
    //TODO: Revisar tipos de datos para los indicadores
    indicators: string[];
}

export interface MapResponse {
    regions: MapRegion[];
}

export class MapService {
    constructor(private readonly mapRepository: MapRepository) {}

    async getRegions(): Promise<MapResponse> {
        logger.debug('Map regions requested');

        const response: MapResponse = {
            regions: (await this.mapRepository.findRegions()).map((region) => ({
                region: region.region,
                lat: region.lat,
                lng: region.lng,
                concentration: region.concentration,
                networkCoverage: region.networkCoverage,
                indicators: [region.profile],
            })),
        };

        logger.debug(`Map regions retrieved: ${response.regions.length}`);

        return response;
    }
}
