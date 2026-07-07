/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MapAntenna } from './MapAntenna';
import type { MapRegion } from './MapRegion';
export type MapResponse = {
    appliedFilters: {
        region: string | null;
        date: string | null;
        period: string | null;
        indicators: Array<string>;
    };
    regions: Array<MapRegion>;
    antennas: Array<MapAntenna>;
};

