import { useEffect, useState } from "react";
import L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "leaflet/dist/leaflet.css";


L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Antena = {
  id: string;
  cluster: string;
  municipio: string;
  lat: number;
  lon: number;
};

export const Empleo = () => {
  const [antenas, setAntenas] = useState<Antena[]>([]);

  useEffect(() => {
    fetch("/antenas_flp.json")
      .then((res) => res.json())
      .then((data: Antena[]) => setAntenas(data))
      .catch(() => setAntenas([]));
  }, []);


  const createClusterIcon = (cluster: L.MarkerCluster) => {
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

//   return L.divIcon({
//     html: `
//       <div class="
//         flex items-center justify-center
//         ${sizeClasses} ${colorClasses}
//         rounded-full text-white font-semibold
//         border-2 border-white/25
//         shadow-lg shadow-black/40
//         transition-transform duration-150 hover:scale-110
//       ">
//         ${count}
//       </div>
//     `,
//     className: "", 
//     iconSize: L.point(36, 36, true),
//   });
    const imageUrl = "https://i.kym-cdn.com/entries/icons/original/000/054/270/rigrig.jpg"
   return L.divIcon({
    html: `
      <div class="
        relative flex items-center justify-center
        ${sizeClasses}
        rounded-full text-white font-semibold
        border-2 border-white/25
        shadow-lg shadow-black/40
        bg-cover bg-center
        transition-transform duration-150 hover:scale-110
      " style="background-image: url('${imageUrl}')">
        <span class="relative z-10 drop-shadow">${count}</span>
      </div>
    `,
    className: "",
    iconSize: L.point(36, 36, true),
  });
};
    const customIcon = new L.Icon({
        iconUrl:
            "https://static.wikia.nocookie.net/riskofrain2_gamepedia_en/images/7/7f/Radar_Scanner.png/revision/latest?cb=20200129193139",
        iconSize: [40, 40],
        iconAnchor: [20, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
    });
  return (
    <MarkerClusterGroup chunkedLoading iconCreateFunction={createClusterIcon}>
      {antenas.map(({ id, lat, lon,municipio, cluster  }) => (
        <Marker key={id} position={[lat, lon]} icon={customIcon}>
          <Popup>
              <strong>{municipio}</strong>
            <br />
            Cluster: {cluster}
            <br />
            ID: {id}
          </Popup>
        </Marker>
      ))}
    </MarkerClusterGroup>
  );
};
