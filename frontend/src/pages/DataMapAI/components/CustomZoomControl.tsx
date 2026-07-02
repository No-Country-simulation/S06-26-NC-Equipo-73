import { useMap } from "react-leaflet";
import { Plus, Minus } from "lucide-react";

export function CustomZoomControl() {
  const map = useMap();

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col   shadow-lg  gap-4">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="flex h-9 w-9 items-center justify-center bg-text-primary text-white hover:bg-slate-700 rounded-sm cursor-pointer"
      >
        <Plus size={24} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="flex h-9 w-9 items-center justify-center bg-text-primary text-white hover:bg-slate-700 rounded-sm cursor-pointer"
      >
        <Minus size={24} />
      </button>
    </div>
  );
}