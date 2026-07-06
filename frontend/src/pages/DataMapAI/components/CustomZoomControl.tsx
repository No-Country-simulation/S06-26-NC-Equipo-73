import { useMap } from "react-leaflet";
import { Plus, Minus } from "lucide-react";

export function CustomZoomControl() {
  const map = useMap();

  const buttonsStyle:string = "flex h-9 w-9 items-center justify-center bg-bg-main text-text-primary hover:bg-bg-main/90 rounded-sm cursor-pointer" 
  return (
    <div className="absolute bottom-10 right-2 z-[1000] flex flex-col   shadow-lg  gap-4">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className={buttonsStyle}
      >
        <Plus size={24} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className={buttonsStyle}
      >
        <Minus size={24} />
      </button>
    </div>
  );
}