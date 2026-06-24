import { Buttons } from "./components/Buttons";
import { MapLayout } from "./components/MapLayout";
import { Marker, Popup } from "react-leaflet";
import type { Servicio } from "./types";
import { useState } from "react";
import { Chat } from "./components/Chat";

const DataMapAI = () => {
    const [servicios, setServicios] = useState<Servicio[]>([
    { name: "Empleo", isActive: true },
    { name: "Salud mental", isActive: false },
    { name: "Formaciones", isActive: false },
    { name: "Mentorias", isActive: false },
    { name: "EXP. estructurantes", isActive: false },
  ]);
    return (
        <div className="grid grid-cols-12 grid-rows-6  h-screen">
            <div className="col-span-9 col-start-1 row-start-1  flex flex-col  p-4">
                <h2 className="text-xl font-bold">Seleccion de servicio:</h2>
                <Buttons servicios={servicios} setServicios={setServicios} />
            </div>
            <MapLayout>
                <Marker position={[-8.591089048076533, -55.23889767670842]}>
                    <Popup>Brasil</Popup>
                </Marker>
            </MapLayout>
            <Chat >

            </Chat>
        </div>
    );
};

export default DataMapAI;

{
    /* <MapLayout>
                <Marker position={[-8.591089048076533, -55.23889767670842]}>
                    <Popup>Brasil</Popup>
                </Marker>
            </MapLayout>

            <aside></aside> */
}
