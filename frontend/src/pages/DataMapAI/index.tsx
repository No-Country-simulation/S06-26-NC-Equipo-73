import { Buttons } from "./components/Buttons";
import { MapLayout } from "./components/MapLayout";
import { CrossDomainLayer, getCrossDomainIndicators } from "./markersGroups/CrossDomainLayer";
import { AntennaLayer } from "./markersGroups/AntennaLayer";
import type { DataMapDomain, MapLayerStatus, Servicio } from "./types";
import { useEffect, useState } from "react";
import { Chat } from "./components/Chat";
import { MessageCircle } from "lucide-react";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { MapaService } from "../../contracts/generated";
import type { MapAntenna, MapRegion } from "../../contracts/generated";

const DataMapAI = () => {
    const [servicios, setServicios] = useState<Servicio[]>([
        { name: "Empleo", isActive: true, disable: false, domain: "employment" },
        { name: "Salud mental", isActive: false, disable: false, domain: "health" },
        { name: "Formaciones", isActive: false, disable: true },
        { name: "Mentorias", isActive: false, disable: true },
        { name: "EXP. estructurantes", isActive: false, disable: true },
    ]);
    const [mapLayerStatus, setMapLayerStatus] = useState<MapLayerStatus>({
        isLoading: false,
        error: null,
        count: 0,
        emptyMessage: null,
    });
    const [regions, setRegions] = useState<MapRegion[]>([]);
    const [antennas, setAntennas] = useState<MapAntenna[]>([]);

    const [isChatOpen, setIsChatOpen] = useState(false);
    
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
    const activeDomain = activeServicio?.domain as DataMapDomain | undefined;

    useEffect(() => {
        let cancelled = false;

        const loadMapData = async () => {
            if (!activeDomain) {
                setRegions([]);
                setAntennas([]);
                setMapLayerStatus({
                    isLoading: false,
                    error: null,
                    count: 0,
                    emptyMessage: null,
                });
                return;
            }

            setMapLayerStatus((current) => ({
                ...current,
                isLoading: true,
                error: null,
            }));

            try {
                const response = await MapaService.getMap({
                    domains: [activeDomain, "telecommunications"],
                    indicators: getCrossDomainIndicators(activeDomain),
                });

                if (cancelled) {
                    return;
                }

                setRegions(response.regions);
                setAntennas(response.antennas);
                setMapLayerStatus((current) => ({
                    ...current,
                    isLoading: false,
                    error: null,
                }));
            } catch (requestError) {
                if (cancelled) {
                    return;
                }

                setRegions([]);
                setAntennas([]);
                setMapLayerStatus((current) => ({
                    ...current,
                    isLoading: false,
                    error:
                        requestError instanceof Error
                            ? requestError.message
                            : "No fue posible cargar el cruce territorial.",
                }));
            }
        };

        void loadMapData();

        return () => {
            cancelled = true;
        };
    }, [activeDomain]);

    return (
        <div className="bg-bg-surface relative grid min-h-screen grid-cols-1 gap-4 p-4 lg:h-screen lg:grid-cols-12 lg:grid-rows-6">
            <div className="flex flex-col gap-2 lg:col-span-9 lg:col-start-1 lg:row-start-1">
                <h2 className="text-primary text-2xl font-extrabold">Selección de servicio:</h2>
                <Buttons servicios={servicios} setServicios={setServicios} />
            </div>

            {!isChatOpen && (
                <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full bg-bg-main px-4 py-3 text-sm font-semibold text-text-primary shadow-lg lg:hidden"
                >
                    <MessageCircle size={18} />
                    Abrir chat
                </button>
            )}

            <Chat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            <MapLayout className="relative  h-[65vh] sm:h-[55vh] z-0 lg:col-span-9 lg:row-span-5 lg:row-start-2 lg:h-full">
                <ResetViewOnChange
                center={center}
                zoom= {zoom}
                trigger={servicios.map((s) => s.isActive).join(",")}
                />
                <AntennaLayer antennas={antennas} />
                {activeDomain ? (
                    <CrossDomainLayer
                        key={activeDomain}
                        primaryDomain={activeDomain}
                        regions={regions}
                        isLoading={mapLayerStatus.isLoading}
                        error={mapLayerStatus.error}
                        onStatusChange={setMapLayerStatus}
                    />
                ) : null}
            </MapLayout>
        </div>
    );
};

export default DataMapAI;
