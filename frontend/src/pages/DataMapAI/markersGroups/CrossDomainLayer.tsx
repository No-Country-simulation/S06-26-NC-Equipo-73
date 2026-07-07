import L from "leaflet";
import { useEffect, useState } from "react";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { MapRegion } from "../../../contracts/generated";
import { CrossDomainRegionMarker } from "../markers/CrossDomainRegionMarker";
import type {
  CrossDomainMapPoint,
  CrossDomainMetricKey,
  CrossDomainMetrics,
  DataMapDomain,
  MapLayerStatus,
} from "../types";
import type { MapIndicatorValue } from "../../../features/map/types";

type CrossDomainLayerProps = {
  primaryDomain: DataMapDomain;
  regions: MapRegion[];
  isLoading: boolean;
  error: string | null;
  onStatusChange?: (status: MapLayerStatus) => void;
};

const TELECOM_INDICATORS = [
  "telecom.congestion",
  "telecom.drop_rate",
  "telecom.active_users",
] as const;

const DOMAIN_CONFIG = {
  employment: {
    label: "empleo",
    indicators: [
      "employment.net_change",
      "employment.average_salary",
    ] as const,
    buildInsights: (metrics: CrossDomainMetrics) => {
      const insights: string[] = [];

      if (metrics.employmentNetChange !== null && metrics.employmentNetChange < 0) {
        insights.push("saldo de empleo negativo");
      }

      if (metrics.telecomCongestion !== null && metrics.telecomCongestion >= 70) {
        insights.push("alta congestión de red");
      }

      if (metrics.telecomDropRate !== null && metrics.telecomDropRate >= 5) {
        insights.push("caídas de red elevadas");
      }

      return insights;
    },
    scoreMaps: (points: CrossDomainMapPoint[]) => [
      normalizeValues(points, "employmentNetChange", true),
      normalizeValues(points, "employmentAverageSalary", true),
      normalizeValues(points, "telecomCongestion"),
      normalizeValues(points, "telecomDropRate"),
    ],
  },
  health: {
    label: "salud",
    indicators: [
      "health.mortality_rate",
      "health.hospitalizations",
    ] as const,
    buildInsights: (metrics: CrossDomainMetrics) => {
      const insights: string[] = [];

      if (metrics.healthMortalityRate !== null && metrics.healthMortalityRate >= 5) {
        insights.push("presión sanitaria alta");
      }

      if (metrics.telecomCongestion !== null && metrics.telecomCongestion >= 70) {
        insights.push("alta congestión de red");
      }

      if (metrics.telecomDropRate !== null && metrics.telecomDropRate >= 5) {
        insights.push("caídas de red elevadas");
      }

      return insights;
    },
    scoreMaps: (points: CrossDomainMapPoint[]) => [
      normalizeValues(points, "healthMortalityRate"),
      normalizeValues(points, "telecomCongestion"),
      normalizeValues(points, "telecomDropRate"),
    ],
  },
} satisfies Record<
  DataMapDomain,
  {
    label: string;
    indicators: readonly string[];
    buildInsights: (metrics: CrossDomainMetrics) => string[];
    scoreMaps: (points: CrossDomainMapPoint[]) => Array<Map<number, number | null>>;
  }
>;

const METRIC_CODE_MAP: Record<CrossDomainMetricKey, string> = {
  employmentNetChange: "employment.net_change",
  employmentAverageSalary: "employment.average_salary",
  healthMortalityRate: "health.mortality_rate",
  healthHospitalizations: "health.hospitalizations",
  telecomCongestion: "telecom.congestion",
  telecomDropRate: "telecom.drop_rate",
  telecomActiveUsers: "telecom.active_users",
};

export function getCrossDomainIndicators(primaryDomain: DataMapDomain): string[] {
  return [
    ...DOMAIN_CONFIG[primaryDomain].indicators,
    ...TELECOM_INDICATORS,
  ];
}

function getIndicatorValue(
  indicators: CrossDomainMapPoint["indicators"],
  code: string,
) {
  return indicators.find((indicator) => indicator.code === code)?.value ?? null;
}

function toMetrics(indicators: CrossDomainMapPoint["indicators"]): CrossDomainMetrics {
  return {
    employmentNetChange: getIndicatorValue(
      indicators,
      METRIC_CODE_MAP.employmentNetChange,
    ),
    employmentAverageSalary: getIndicatorValue(
      indicators,
      METRIC_CODE_MAP.employmentAverageSalary,
    ),
    healthMortalityRate: getIndicatorValue(
      indicators,
      METRIC_CODE_MAP.healthMortalityRate,
    ),
    healthHospitalizations: getIndicatorValue(
      indicators,
      METRIC_CODE_MAP.healthHospitalizations,
    ),
    telecomCongestion: getIndicatorValue(indicators, METRIC_CODE_MAP.telecomCongestion),
    telecomDropRate: getIndicatorValue(indicators, METRIC_CODE_MAP.telecomDropRate),
    telecomActiveUsers: getIndicatorValue(indicators, METRIC_CODE_MAP.telecomActiveUsers),
  };
}

function normalizeValues(
  points: CrossDomainMapPoint[],
  key: CrossDomainMetricKey,
  inverse = false,
) {
  const values = points
    .map((point) => point.metrics[key])
    .filter((value): value is number => value !== null);

  if (values.length === 0) {
    return new Map(points.map((point) => [point.municipalityCode, null]));
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  return new Map(
    points.map((point) => {
      const value = point.metrics[key];

      if (value === null) {
        return [point.municipalityCode, null];
      }

      if (min === max) {
        return [point.municipalityCode, 0.5];
      }

      const normalized = (value - min) / (max - min);
      return [point.municipalityCode, inverse ? 1 - normalized : normalized];
    }),
  );
}

function getScoreLabel(score: number | null): CrossDomainMapPoint["scoreLabel"] {
  if (score === null) {
    return "insufficient_data";
  }

  if (score >= 70) {
    return "critical";
  }

  if (score >= 45) {
    return "warning";
  }

  return "stable";
}

function buildInsight(
  primaryDomain: DataMapDomain,
  scoreLabel: CrossDomainMapPoint["scoreLabel"],
  metrics: CrossDomainMetrics,
) {
  const { buildInsights } = DOMAIN_CONFIG[primaryDomain];
  const insights = buildInsights(metrics);

  if (insights.length > 0) {
    return `Senal combinada: ${insights.join(", ")}.`;
  }

  if (scoreLabel === "stable") {
    return primaryDomain === "employment"
      ? "Comportamiento relativamente estable entre empleo y red."
      : "Comportamiento relativamente estable entre salud y red.";
  }

  return "Hay datos parciales, pero no una senal dominante en el cruce.";
}

function toIndicatorValue(indicator: {
  code: string;
  domain: MapIndicatorValue["domain"];
  label: string;
  description: string;
  value: number | null;
  unit: string;
  aggregation: MapIndicatorValue["aggregation"];
  status: MapIndicatorValue["status"];
  source: string;
  observation: {
    date: string | null;
    period: string | null;
  };
}): MapIndicatorValue {
  return {
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
  };
}

const createClusterIcon = (cluster: { getChildCount: () => number }) => {
  const count = cluster.getChildCount();

  let sizeClasses = "h-9 w-9 text-xs";
  let colorClasses = "bg-gradient-to-br from-amber-500 to-red-700";

  if (count >= 50) {
    sizeClasses = "h-14 w-14 text-base";
    colorClasses = "bg-gradient-to-br from-red-600 to-red-900";
  } else if (count >= 10) {
    sizeClasses = "h-11 w-11 text-sm";
    colorClasses = "bg-gradient-to-br from-amber-500 to-orange-700";
  }

  return L.divIcon({
    html: `
      <div class="
        flex items-center justify-center
        ${sizeClasses} ${colorClasses}
        rounded-full text-white font-semibold
        border-2 border-white/25
        shadow-lg shadow-black/40
      ">
        ${count}
      </div>
    `,
    className: "",
    iconSize: L.point(36, 36, true),
  });
};

export const CrossDomainLayer = ({
  primaryDomain,
  regions,
  isLoading,
  error,
  onStatusChange,
}: CrossDomainLayerProps) => {
  const [data, setData] = useState<CrossDomainMapPoint[]>([]);

  useEffect(() => {
    const indicatorCodes = new Set<string>(getCrossDomainIndicators(primaryDomain));
    const basePoints: CrossDomainMapPoint[] = regions.map((region) => {
      const filteredIndicators = region.indicators
        .filter((indicator) => indicatorCodes.has(indicator.code))
        .map(toIndicatorValue);

      return {
        municipalityCode: region.municipalityCode,
        region: region.region,
        lat: region.lat,
        lng: region.lng,
        profileDescription: region.profileDescription,
        indicators: filteredIndicators,
        metrics: toMetrics(filteredIndicators),
        compositeScore: null,
        scoreLabel: "insufficient_data",
        insight: "",
      };
    });

    const scoreMaps = DOMAIN_CONFIG[primaryDomain].scoreMaps(basePoints);

    const nextData = basePoints.map((point) => {
      const normalizedValues = scoreMaps
        .map((scoreMap) => scoreMap.get(point.municipalityCode) ?? null)
        .filter((value): value is number => value !== null);

      const compositeScore =
        normalizedValues.length === 0
          ? null
          : Math.round(
              (normalizedValues.reduce((sum, value) => sum + value, 0) /
                normalizedValues.length) *
                100,
            );

      const scoreLabel = getScoreLabel(compositeScore);

      return {
        ...point,
        compositeScore,
        scoreLabel,
        insight: buildInsight(primaryDomain, scoreLabel, point.metrics),
      };
    });

    setData(nextData);
  }, [primaryDomain, regions]);

  useEffect(() => {
    onStatusChange?.({
      isLoading,
      error,
      count: data.length,
      emptyMessage:
        !isLoading && !error && data.length === 0
          ? `No hay regiones para construir el cruce entre ${DOMAIN_CONFIG[primaryDomain].label} y red.`
          : null,
    });
  }, [data.length, error, isLoading, onStatusChange, primaryDomain]);

  if (data.length === 0) {
    return null;
  }

  return (
    <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterIcon}>
      {data.map((point) => (
        <CrossDomainRegionMarker
          key={`cross-domain-${point.municipalityCode}`}
          point={point}
          primaryDomain={primaryDomain}
        />
      ))}
    </MarkerClusterGroup>
  );
};
