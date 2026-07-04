/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MapIndicator = {
    code: string;
    domain: MapIndicator.domain;
    label: string;
    description: string;
    value: number | null;
    unit: string;
    aggregation: MapIndicator.aggregation;
    status: MapIndicator.status;
    source: string;
    observation: {
        date: string | null;
        period: string | null;
    };
};
export namespace MapIndicator {
    export enum domain {
        TELECOMMUNICATIONS = 'telecommunications',
        HEALTH = 'health',
        EMPLOYMENT = 'employment',
    }
    export enum aggregation {
        SUM = 'sum',
        WEIGHTED_AVERAGE = 'weighted_average',
        AVERAGE = 'average',
        AVERAGE_BY_PERIOD = 'average_by_period',
        RATE = 'rate',
    }
    export enum status {
        AVAILABLE = 'available',
        NO_DATA = 'no_data',
    }
}

