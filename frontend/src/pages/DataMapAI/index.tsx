import { Buttons } from "./components/Buttons";
import { MapLayout } from "./components/MapLayout";
import { Empleo } from "./markersGroups/Empleo";
import { SaludMental } from "./markersGroups/SaludMental";
import { Formaciones } from "./markersGroups/Formaciones";
import { Mentorias } from "./markersGroups/Mentorias";
import type { Servicio } from "./types";
import { useEffect, useState } from "react";
import { Chat } from "./components/Chat";
import { MessageCircle } from "lucide-react";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { useMapIndicators } from "../../features/map/hooks/useMapIndicators";

const DataMapAI = () => {
    const [servicios, setServicios] = useState<Servicio[]>([
        { name: "Empleo", isActive: false, disable: false },
        { name: "Salud mental", isActive: false, disable: false },
        { name: "Formaciones", isActive: false, disable: false },
        { name: "Mentorias", isActive: false, disable: false },
        { name: "EXP. estructurantes", isActive: false, disable: true },
    ]);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const {
        data: indicatorCatalog,
        error: indicatorCatalogError,
        isLoading: isLoadingIndicatorCatalog,
    } = useMapIndicators();
    
    const center: LatLngExpression = [-8.591089048076533, -55.23889767670842];
    const zoom:number = 3;
    function ResetViewOnChange({ center, zoom, trigger }: any) {
        const map = useMap();
      
        useEffect(() => {
            map.flyTo(center, zoom, {duration: 0.2});

        }, [trigger]);
        return null;
    }

    const activeServicio = servicios.find((servicio) => servicio.isActive);
    const renderMarkers = () => {
        if (!activeServicio) return null;

        switch (activeServicio.name) {
            case "Empleo":
                return <Empleo />;
            case "Salud mental":
                return <SaludMental />;
            case "Formaciones":
                return <Formaciones />;
            case "Mentorias":
                return <Mentorias />;
            // case "EXP. estructurantes":
            //   return <ExperienciasEstructurantes />;
            default:
                return null;
        }
    };
    return (
        <div className="relative grid min-h-screen grid-cols-1 gap-4 p-4 lg:h-screen lg:grid-cols-12 lg:grid-rows-6">
            <div className="flex flex-col gap-2 lg:col-span-9 lg:col-start-1 lg:row-start-1">
                <h2 className="text-xl font-bold">Selección de servicio:</h2>
                <p className="text-sm text-text-primary/70">
                    {isLoadingIndicatorCatalog && "Cargando catálogo de indicadores..."}
                    {!isLoadingIndicatorCatalog && !indicatorCatalogError && `Indicadores disponibles: ${indicatorCatalog.length}`}
                    {indicatorCatalogError && "No se pudo cargar el catálogo del mapa."}
                </p>
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
                <ResetViewOnChange
                center={center}
                zoom= {zoom}
                trigger={servicios.map((s) => s.isActive).join(",")}
                />
                {renderMarkers()}
            </MapLayout>
        </div>
    );
};

export default DataMapAI;
