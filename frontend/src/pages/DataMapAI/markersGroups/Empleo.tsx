import { useEffect, useState } from "react";
import L from "leaflet";
// import type { MarkerCluster } from "leaflet.markercluster"; // no anda el typo
import { AntenaMarker } from "../markers/AntenaMarker";
import MarkerClusterGroup from "react-leaflet-cluster";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import type { Antena } from "../markers/types";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();

  let sizeClasses = "h-9 w-9 text-xs";
  let colorClasses = "bg-gradient-to-br from-blue-500 to-blue-700";

  if (count >= 50) {
    sizeClasses = "h-14 w-14 text-base";
    colorClasses = "bg-gradient-to-br from-red-500 to-red-800";
  } else if (count >= 10) {
    sizeClasses = "h-11 w-11 text-sm";
    colorClasses = "bg-gradient-to-br from-orange-500 to-orange-700";
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



export const Empleo = () => {
  const [antenas, setAntenas] = useState<Antena[]>([]);

  useEffect(() => {
    fetch("/antenas_flp.json")
      .then((res) => res.json())
      .then((data: Antena[]) => setAntenas(data))
      .catch(() => setAntenas([]));
  }, []);

  return (
    <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterIcon}>
      {antenas.map((antena) => (
        <AntenaMarker key={antena.id} {...antena} />
      ))}
    </MarkerClusterGroup>
  );
};
