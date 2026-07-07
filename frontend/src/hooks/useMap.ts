// useMap.ts
import { useQuery } from '@tanstack/react-query';
import { mapaApi } from '../api/mapa';
import type { GetMapParams } from '../api/mapa';

export const useIndicators = () => {
  return useQuery({
    queryKey: ['mapa', 'indicadores'],
    queryFn: mapaApi.getIndicators,
  });
};

export const useMapApi = (params?: GetMapParams) => {
  return useQuery({
    queryKey: ['mapa', params],
    queryFn: () => mapaApi.getMap(params),
  });
};