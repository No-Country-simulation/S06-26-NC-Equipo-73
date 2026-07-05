import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
export const Mentorias = () => {
    const customIcon1 = new L.Icon({
        iconUrl:
            "https://i.kym-cdn.com/entries/icons/original/000/054/270/rigrig.jpg",
        iconSize: [40, 40],
        iconAnchor: [20, 41],
        popupAnchor: [20, 0],
        shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        shadowSize: [41, 41],
        className: "rounded-full",
    });

    return (
        <Marker position={[-7.9924687, -53.2589603]} icon={customIcon1}>
            <Popup >
                miau
            </Popup>
        </Marker>
    );
};
