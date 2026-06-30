import type { ReactNode } from "react";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";
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
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
};
