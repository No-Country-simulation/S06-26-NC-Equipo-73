import logger from '../config/logger.js';

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
    getRegions(): MapResponse {
        logger.debug('Map regions requested');

        const response: MapResponse = {
            regions: [],
        };

        logger.debug(`Map regions retrieved: ${response.regions.length}`);

        return response;
    }
}
