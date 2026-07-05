import { Marker, Popup } from "react-leaflet";
import {antena}  from "../markers/customIcons/antena";
import type { Antena } from "../markers/types";
export const AntenaMarker = ({ id, lat, lon, municipio, cluster }: Antena) => (
    <Marker key={id} position={[lat, lon]} icon={antena}>
        <Popup>
            <strong>{municipio}</strong>
            <br />
            Cluster: {cluster}
            <br />
            ID: {id}
        </Popup>
    </Marker>
);
