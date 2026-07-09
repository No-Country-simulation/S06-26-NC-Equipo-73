import type { ReactNode } from "react";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { CustomZoomControl } from "./CustomZoomControl";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { ResetViewButton } from "./ResetViewButton";
interface MapLayoutProps {
    children?: ReactNode;
    className?: string;
    isLoading?: boolean;
}
const center: LatLngExpression = [-8.591089048076533, -55.23889767670842];
const zoom: number = 3;
const SetInitialView = () => {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom);
    }, [map]);

    return null;
};



export const MapLayout = ({
    children,
    className,
    isLoading = false,
}: MapLayoutProps) => {
    return (
        <div className={`relative w-full ${className ?? ""}`}>
            <MapContainer
                className="h-full w-full"
                center={center}
                zoom={zoom}
                scrollWheelZoom={true}
                zoomControl={false}
            >
                <SetInitialView />
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                {children}
                <CustomZoomControl />
                <ResetViewButton />
            </MapContainer>

            {isLoading ? (
                <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 bg-bg-surface/55 backdrop-blur-[2px]">
                    <LoaderCircle
                        className="text-primary h-10 w-10 animate-spin"
                        aria-hidden="true"
                    />
                    <p className="text-primary text-sm font-semibold">
                        Cargando datos del mapa...
                    </p>
                </div>
            ) : null}
        </div>
    );
};
