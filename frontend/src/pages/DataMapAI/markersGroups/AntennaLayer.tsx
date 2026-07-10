import MarkerClusterGroup from "react-leaflet-cluster";
import { AntenaMarker } from "../markers/AntenaMarker";
import type { Antena } from "../markers/types";

type AntennaLayerProps = {
  antennas: Antena[];
};

export const AntennaLayer = ({ antennas }: AntennaLayerProps) => {
  if (antennas.length === 0) {
    return null;
  }

  return (
    <MarkerClusterGroup chunkedLoading>
      {antennas.map((antenna) => (
        <AntenaMarker key={antenna.ecgi} {...antenna} />
      ))}
    </MarkerClusterGroup>
  );
};
