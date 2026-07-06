import { MapLayout } from "./components/MapLayout";
import { Marker, Popup } from "react-leaflet";
const DataMapAI = () => {
    return (
        <MapLayout>
            <Marker position={[-8.591089048076533, -55.23889767670842]}>
                <Popup>Brasil</Popup>
            </Marker>
        </MapLayout>
    );
};

export default DataMapAI;
