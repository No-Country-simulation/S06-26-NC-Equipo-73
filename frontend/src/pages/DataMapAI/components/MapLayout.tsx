import type { ReactNode } from "react";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
import { Plus, Minus } from "lucide-react";

import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapLayoutProps {
  children?: ReactNode;
  className?: string;
}

const center: LatLngExpression = [-8.591089048076533, -55.23889767670842];
const zoom:number = 3;
const SetInitialView = () => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);

  }, [map]);

  return null;
};

function CustomZoomControl() {
  const map = useMap();

  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col   shadow-lg  gap-4">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="flex h-9 w-9 items-center justify-center bg-text-primary text-white hover:bg-slate-700 rounded-sm cursor-pointer"
      >
        <Plus size={24} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="flex h-9 w-9 items-center justify-center bg-text-primary text-white hover:bg-slate-700 rounded-sm cursor-pointer"
      >
        <Minus size={24} />
      </button>
    </div>
  );
}
export const MapLayout = ({ children, className }: MapLayoutProps) => {
  return (
    <MapContainer
      className={`w-full ${className ?? ""}`}
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      <SetInitialView />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
      {children}
      <CustomZoomControl />
    </MapContainer>
  );
};
