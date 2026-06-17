export interface MapRegion {
    region: string;
    lat: number;
    lng: number;
    concentration: number;
    networkCoverage: number;
    indicators: string[];
}

export interface MapResponse {
    regions: MapRegion[];
}

export class MapService {
    getRegions(): MapResponse {
        return {
            regions: [],
        };
    }
}
