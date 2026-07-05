/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MapResponse } from '../models/MapResponse';
import type { IndicatorCatalogResponse } from '../models/IndicatorCatalogResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MapaService {
    /**
     * Obtiene el catálogo de indicadores disponibles
     * @returns IndicatorCatalogResponse Catálogo de indicadores por dominio
     * @throws ApiError
     */
    public static getMapIndicators(): CancelablePromise<IndicatorCatalogResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mapa/indicadores',
        });
    }
    /**
     * Obtiene las regiones y sus indicadores para el mapa
     * @returns MapResponse Regiones disponibles para el mapa
     * @throws ApiError
     */
    public static getMap({
        region,
        date,
        period,
        indicators,
        domains,
    }: {
        region?: string,
        date?: string,
        period?: string,
        indicators?: Array<string>,
        domains?: Array<'telecommunications' | 'health' | 'employment'>,
    } = {}): CancelablePromise<MapResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mapa',
            query: {
                'region': region,
                'date': date,
                'period': period,
                'indicators': indicators,
                'domains': domains,
            },
            errors: {
                400: `Parámetros de consulta inválidos`,
            },
        });
    }
}
