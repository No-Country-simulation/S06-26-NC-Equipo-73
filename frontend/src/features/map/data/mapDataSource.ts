import type { MapRegion } from "../../../contracts/generated";
import { MapaService } from "../../../contracts/generated";
import type {
  MapData,
  MapIndicatorCatalogItem,
  MapPoint,
  MapQueryFilters,
} from "../types";

function toMapPoint(region: MapRegion): MapPoint {
  return {
    municipalityCode: region.municipalityCode,
    region: region.region,
    lat: region.lat,
    lng: region.lng,
    profileDescription: region.profileDescription,
    indicators: region.indicators.map((indicator) => ({
      code: indicator.code,
      domain: indicator.domain,
      label: indicator.label,
      description: indicator.description,
      value: indicator.value,
      unit: indicator.unit,
      aggregation: indicator.aggregation,
      status: indicator.status,
      source: indicator.source,
      observationDate: indicator.observation.date,
      observationPeriod: indicator.observation.period,
    })),
  };
}

export async function getMapIndicatorCatalog(): Promise<MapIndicatorCatalogItem[]> {
  const response = await MapaService.getMapIndicators();

  return response.indicators.map((indicator) => ({
    code: indicator.code,
    domain: indicator.domain,
    label: indicator.label,
    description: indicator.description,
    unit: indicator.unit,
    aggregation: indicator.aggregation,
    source: indicator.source,
  }));
}

export async function getMapData(filters: MapQueryFilters = {}): Promise<MapData> {
  const response = await MapaService.getMap({
    region: filters.region,
    date: filters.date,
    period: filters.period,
    indicators: filters.indicators,
    domains: filters.domains,
  });

  return {
    appliedFilters: {
      region: response.appliedFilters.region,
      date: response.appliedFilters.date,
      period: response.appliedFilters.period,
      indicators: [...response.appliedFilters.indicators],
    },
    regions: response.regions.map(toMapPoint),
  };
}
