import { MapaService } from '../contracts/generated/services/MapaService';
import type {MapResponse}  from '../contracts/generated/models/MapResponse';
import type { IndicatorCatalogResponse } from '../contracts/generated/models/IndicatorCatalogResponse';
export interface GetMapParams {
  region?: string;
  date?: string;
  period?: string;
  indicators?: string[];
  domains?: Array<'telecommunications' | 'health' | 'employment'>;
}

export const mapaApi = {
  getIndicators: (): Promise<IndicatorCatalogResponse> => {
    return MapaService.getMapIndicators();
  },

  getMap: (params?: GetMapParams): Promise<MapResponse> => {
    return MapaService.getMap(params);
  },
};