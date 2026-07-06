import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { CrossDomainMapPoint, DataMapDomain } from "../types";

type CrossDomainRegionMarkerProps = {
  point: CrossDomainMapPoint;
  primaryDomain: DataMapDomain;
};

function getMarkerColor(scoreLabel: CrossDomainMapPoint["scoreLabel"]) {
  switch (scoreLabel) {
    case "critical":
      return "#b91c1c";
    case "warning":
      return "#d97706";
    case "stable":
      return "#15803d";
    default:
      return "#64748b";
  }
}

function createMarkerIcon(color: string, score: number | null) {
  return L.divIcon({
    html: `
      <div
        style="
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 9999px;
          background: ${color};
          color: white;
          border: 2px solid white;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
        "
      >${score ?? "?"}</div>
    `,
    className: "",
    iconSize: [24, 20],
    iconAnchor: [12, 10],
    popupAnchor: [0, -8],
  });
}

function formatValue(value: number | null, unit: string) {
  if (value === null) {
    return "Sin datos";
  }

  const formattedValue = Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 2,
  }).format(value);

  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

function formatScoreLabel(scoreLabel: CrossDomainMapPoint["scoreLabel"]) {
  switch (scoreLabel) {
    case "critical":
      return "Crítico";
    case "warning":
      return "Alerta";
    case "stable":
      return "Estable";
    default:
      return "Datos insuficientes";
  }
}

function getContextLabel(primaryDomain: DataMapDomain) {
  return primaryDomain === "employment" ? "empleo + red" : "salud + red";
}

export const CrossDomainRegionMarker = ({
  point,
  primaryDomain,
}: CrossDomainRegionMarkerProps) => {
  const icon = createMarkerIcon(
    getMarkerColor(point.scoreLabel),
    point.compositeScore,
  );

  return (
    <Marker position={[point.lat, point.lng]} icon={icon}>
      <Popup>
        <div className="min-w-64 space-y-3">
          <div>
            <strong>{point.region}</strong>
            <div>Código: {point.municipalityCode}</div>
          </div>

          <div>
            <strong>Score {getContextLabel(primaryDomain)}</strong>:{" "}
            {point.compositeScore ?? "Sin datos"} ({formatScoreLabel(point.scoreLabel)})
          </div>

          <p>{point.insight}</p>
          <p>{point.profileDescription}</p>

          <div>
            <strong>Indicadores considerados</strong>
            <ul>
              {point.indicators.map((indicator) => (
                <li key={indicator.code}>
                  {indicator.label}: {formatValue(indicator.value, indicator.unit)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
