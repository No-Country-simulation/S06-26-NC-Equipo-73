import type { MapIndicatorValue, MapDomain } from "../../features/map/types";

export type Servicio = {
  name: string
  isActive: boolean
  setServicios?: React.Dispatch<React.SetStateAction<Servicio[]>>
  disable?: boolean
  domain?: DataMapDomain
}

export type MapLayerStatus = {
  isLoading: boolean
  error: string | null
  count: number
  emptyMessage: string | null
}

export type DataMapDomain = Extract<MapDomain, "employment" | "health">

export type CrossDomainMetricKey =
  | "employmentNetChange"
  | "employmentAverageSalary"
  | "healthMortalityRate"
  | "healthHospitalizations"
  | "telecomCongestion"
  | "telecomDropRate"
  | "telecomActiveUsers"

export type CrossDomainMetrics = Record<CrossDomainMetricKey, number | null>

export type CrossDomainMapPoint = {
  municipalityCode: number
  region: string
  lat: number
  lng: number
  profileDescription: string
  metrics: CrossDomainMetrics
  indicators: MapIndicatorValue[]
  compositeScore: number | null
  scoreLabel: "critical" | "warning" | "stable" | "insufficient_data"
  insight: string
}
