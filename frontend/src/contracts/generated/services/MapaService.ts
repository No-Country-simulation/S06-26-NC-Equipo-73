/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MapResponse } from '../models/MapResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MapaService {
    /**
     * Obtiene las regiones y sus indicadores para el mapa
     * @returns MapResponse Regiones disponibles para el mapa
     * @throws ApiError
     */
    public static getMap(): CancelablePromise<MapResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/mapa',
        });
    }
}
