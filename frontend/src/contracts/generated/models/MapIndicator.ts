/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MapIndicator = {
    code: string;
    domain: 'telecommunications' | 'health' | 'employment';
    label: string;
    description: string;
    value: number | null;
    unit: string;
    aggregation: 'sum' | 'weighted_average' | 'average' | 'average_by_period' | 'rate';
    status: 'available' | 'no_data';
    source: string;
    observation: {
        date: string | null;
        period: string | null;
    };
};

