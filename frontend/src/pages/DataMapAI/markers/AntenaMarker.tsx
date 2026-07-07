import { Marker, Popup } from "react-leaflet";
import {antena}  from "../markers/customIcons/antena";
import type { Antena } from "../markers/types";

function formatNumber(value: number | null, unit = "", maximumFractionDigits = 2) {
    if (value === null) {
        return "Sin datos";
    }

    const formattedValue = Intl.NumberFormat("es-CL", {
        maximumFractionDigits,
    }).format(value);

    return unit ? `${formattedValue} ${unit}` : formattedValue;
}

export const AntenaMarker = ({
    ecgi,
    lat,
    lng,
    municipality,
    municipalityCode,
    cluster,
    profileDescription,
    networkSummary,
}: Antena) => (
    <Marker key={ecgi} position={[lat, lng]} icon={antena}>
        <Popup>
            <div className="min-w-64 space-y-2">
                <div>
                    <strong>{municipality}</strong>
                    <div>Código municipio: {municipalityCode}</div>
                </div>

                <div>
                    <strong>Zona</strong>: {cluster}
                </div>

                <div>
                    <strong>Perfil</strong>: {profileDescription}
                </div>

                <div>
                    <strong>ECGI</strong>: {ecgi}
                </div>

                <div>
                    <strong>Resumen de red</strong>
                    <div>Fecha: {networkSummary.observationDate ?? "Sin datos"}</div>
                    <div>Período: {networkSummary.observationPeriod ?? "Todos"}</div>
                    <div>Usuarios activos: {formatNumber(networkSummary.activeUsers, "usuarios", 0)}</div>
                    <div>Sesiones: {formatNumber(networkSummary.sessions, "sesiones", 0)}</div>
                    <div>Congestión: {formatNumber(networkSummary.congestion, "%")}</div>
                    <div>Tasa de caídas: {formatNumber(networkSummary.dropRate, "%")}</div>
                </div>
            </div>
        </Popup>
    </Marker>
);
