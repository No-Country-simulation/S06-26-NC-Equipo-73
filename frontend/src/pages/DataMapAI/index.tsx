import { Buttons } from "./components/Buttons";
import { MapLayout } from "./components/MapLayout";
import { Marker, Popup } from "react-leaflet";
import type { Servicio } from "./types";
import { useState } from "react";
import { Chat } from "./components/Chat";
import { MessageCircle } from "lucide-react";

const DataMapAI = () => {
  const [servicios, setServicios] = useState<Servicio[]>([
    { name: "Empleo", isActive: false },
    { name: "Salud mental", isActive: false },
    { name: "Formaciones", isActive: false },
    { name: "Mentorias", isActive: false },
    { name: "EXP. estructurantes", isActive: false },
  ]);

  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="relative grid min-h-screen grid-cols-1 gap-4 p-4 lg:h-screen lg:grid-cols-12 lg:grid-rows-6">
      <div className="flex flex-col gap-2 lg:col-span-9 lg:col-start-1 lg:row-start-1">
        <h2 className="text-xl font-bold">Selección de servicio:</h2>
        <Buttons servicios={servicios} setServicios={setServicios} />
      </div>

      {!isChatOpen && (
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-text-primary px-4 py-3 text-sm font-semibold text-white shadow-lg lg:hidden"
        >
          <MessageCircle size={18} />
          Abrir chat
        </button>
      )}

      <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <MapLayout className="relative  h-[50vh] sm:h-[55vh] z-0 lg:col-span-9 lg:row-span-5 lg:row-start-2 lg:h-full">
        <Marker position={[-8.591089048076533, -55.23889767670842]}>
          <Popup>Brasil</Popup>
        </Marker>
      </MapLayout>


    </div>
  );
};

export default DataMapAI;
