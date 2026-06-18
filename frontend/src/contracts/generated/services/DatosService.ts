/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DataRequest } from '../models/DataRequest';
import type { DataResponse } from '../models/DataResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DatosService {
    /**
     * Consulta datos mediante lenguaje natural y filtros
     * @returns DataResponse Resultado de la consulta
     * @throws ApiError
     */
    public static queryData({
        requestBody,
    }: {
        requestBody: DataRequest,
    }): CancelablePromise<DataResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/datos',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Solicitud inválida`,
            },
        });
    }
}
