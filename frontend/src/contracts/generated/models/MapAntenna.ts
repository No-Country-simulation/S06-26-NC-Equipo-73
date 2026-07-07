/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MapAntenna = {
    ecgi: string;
    cluster: string;
    municipalityCode: number;
    municipality: string;
    profileDescription: string;
    lat: number;
    lng: number;
    networkSummary: {
        observationDate: string | null;
        observationPeriod: string | null;
        activeUsers: number | null;
        sessions: number | null;
        congestion: number | null;
        dropRate: number | null;
    };
};

