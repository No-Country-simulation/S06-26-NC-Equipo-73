import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import empleoIcon from "./customIcons/empleo.svg";
import saludIcon from "./customIcons/salud.svg";
import type { CrossDomainMapPoint, DataMapDomain } from "../types";

type CrossDomainRegionMarkerProps = {
  point: CrossDomainMapPoint;
  primaryDomain: DataMapDomain;
};

function createMarkerIcon(primaryDomain: DataMapDomain) {
  const iconUrl = primaryDomain === "employment" ? empleoIcon : saludIcon;

  return L.icon({
    iconUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -12],
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
  const icon = createMarkerIcon(primaryDomain);

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
