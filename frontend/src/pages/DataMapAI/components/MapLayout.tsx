import type { ReactNode } from "react";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapLayoutProps {
  children?: ReactNode;
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

export const MapLayout = ({ children }: MapLayoutProps) => {
  return (
    <MapContainer className="h-screen w-full">
      <SetInitialView />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {children}
    </MapContainer>
  );
};
