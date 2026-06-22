import { Buttons } from "./components/Buttons";
import { MapLayout } from "./components/MapLayout";
import { Marker, Popup } from "react-leaflet";
import type { Servicio } from "./types";
import { useState } from "react";

const DataMapAI = () => {
    const [servicios, setServicios] = useState<Servicio[]>([
    { name: "Empleo", isActive: true },
    { name: "Salud mental", isActive: false },
    { name: "Formaciones", isActive: false },
    { name: "Mentorias", isActive: false },
    { name: "EXP. estructurantes", isActive: false },
  ]);
    return (
        <div className="grid grid-cols-12 grid-rows-5 gap-4 h-screen">
            <div className="col-span-8  flex flex-col gap-4 p-4">
                <h2 className="text-xl font-bold">Seleccion de servicio:</h2>
                <Buttons servicios={servicios} setServicios={setServicios} />
            </div>
            <MapLayout>
                <Marker position={[-8.591089048076533, -55.23889767670842]}>
                    <Popup>Brasil</Popup>
                </Marker>
            </MapLayout>
            <aside className="col-span-4 row-span-5 col-start-9 bg-red-400"></aside>
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
