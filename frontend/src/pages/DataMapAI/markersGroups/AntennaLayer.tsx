import MarkerClusterGroup from "react-leaflet-cluster";
import { AntenaMarker } from "../markers/AntenaMarker";
import type { Antena } from "../markers/types";
import { createSharedClusterIcon } from "./clusterIcon";

const antennaClusterOffset = { x: 6, y: -4 };

type AntennaLayerProps = {
  antennas: Antena[];
};

export const AntennaLayer = ({ antennas }: AntennaLayerProps) => {
  if (antennas.length === 0) {
    return null;
  }

  return (
    <MarkerClusterGroup
      chunkedLoading
      iconCreateFunction={(cluster: any) => createSharedClusterIcon(cluster, antennaClusterOffset)}
    >
      {antennas.map((antenna) => (
        <AntenaMarker key={antenna.ecgi} {...antenna} />
      ))}
    </MarkerClusterGroup>
  );
};
