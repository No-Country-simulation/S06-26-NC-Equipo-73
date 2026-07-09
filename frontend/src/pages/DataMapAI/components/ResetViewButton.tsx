import { Scan } from "lucide-react";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
export const ResetViewButton = () => {
    const map = useMap();
    const center: LatLngExpression = [-8.591089048076533, -55.23889767670842];
    const zoom: number = 3;
    const handleResetView = () => {
        map.flyTo(center, zoom, { duration: 0.2 });
    };

    return (
        <button
            type="button"
            className="absolute bottom-10 left-2 z-[1000] flex h-9 w-9 items-center justify-center rounded-sm bg-bg-main text-text-primary hover:bg-bg-main/90"
            onClick={handleResetView}
            aria-label="Restablecer vista del mapa"
        >
            <Scan size={24} className="text-text-primary" />
        </button>
    );
};
