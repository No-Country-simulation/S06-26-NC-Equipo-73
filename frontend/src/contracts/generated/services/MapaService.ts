/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { IndicatorCatalogResponse } from '../models/IndicatorCatalogResponse';
import type { MapResponse } from '../models/MapResponse';
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
     * Obtiene municipios y sus indicadores para el mapa
     * @returns MapResponse Municipios disponibles para el mapa
     * @throws ApiError
     */
    public static getMap({
        region,
        date,
        period,
        indicators,
        domains,
    }: {
        /**
         * Nombre exacto de la zona, sin distinguir mayúsculas
         */
        region?: string,
        /**
         * Fecha de observación. Si se omite se usa la fecha más reciente disponible
         */
        date?: string,
        /**
         * Periodo cargado en el tensor, por ejemplo MANHA
         */
        period?: string,
        /**
         * Indicadores separados por coma. Si se omite se devuelven todos
         */
        indicators?: Array<string>,
        /**
         * Limita la respuesta a uno o más dominios
         */
        domains?: Array<'telecommunications' | 'health' | 'employment'>,
    }): CancelablePromise<MapResponse> {
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
