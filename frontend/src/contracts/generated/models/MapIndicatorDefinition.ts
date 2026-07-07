/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MapIndicatorDefinition = {
    code: string;
    domain: MapIndicatorDefinition.domain;
    label: string;
    description: string;
    unit: string;
    aggregation: MapIndicatorDefinition.aggregation;
    source: string;
};
export namespace MapIndicatorDefinition {
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
}

