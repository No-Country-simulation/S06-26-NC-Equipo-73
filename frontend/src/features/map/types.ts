export type MapDomain = "telecommunications" | "health" | "employment";

export type MapIndicatorCatalogItem = {
  code: string;
  domain: MapDomain;
  label: string;
  description: string;
  unit: string;
  aggregation: string;
  source: string;
};

export type MapIndicatorValue = {
  code: string;
  domain: MapDomain;
  label: string;
  description: string;
  value: number | null;
  unit: string;
  aggregation: string;
  status: string;
  source: string;
  observationDate: string | null;
  observationPeriod: string | null;
};

export type MapPoint = {
  municipalityCode: number;
  region: string;
  lat: number;
  lng: number;
  profileDescription: string;
  indicators: MapIndicatorValue[];
};

export type MapQueryFilters = {
  region?: string;
  date?: string;
  period?: string;
  indicators?: string[];
  domains?: MapDomain[];
};

export type MapData = {
  appliedFilters: {
    region: string | null;
    date: string | null;
    period: string | null;
    indicators: string[];
  };
  regions: MapPoint[];
};
