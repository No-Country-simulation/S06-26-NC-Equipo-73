import type { Servicio } from "../types";

type Props = {
  servicios: Servicio[];
  setServicios: React.Dispatch<React.SetStateAction<Servicio[]>>;
};

export const Buttons = ({ servicios, setServicios }: Props) => {
  const handleClick = (name: string) => {
    setServicios((prev) =>
      prev.map((servicio) => ({
        ...servicio,
        isActive: servicio.name === name,
      })),
    );
  };

  const baseStyle = "font-bold text-sm px-4 py-2.5 rounded-md";
  const hoverStyle =
    "hover:bg-text-primary/80 hover:scale-105 transition-all duration-300 cursor-pointer";

  return (
    <div className="flex flex-wrap gap-2 sm:gap-4">
      {servicios.map(({ name, isActive }) => (
        <button
          key={name}
          type="button"
          className={`${baseStyle} ${hoverStyle} ${
            isActive ? "bg-inherit text-black" : "bg-text-primary text-white"
          } border border-text-primary  w-auto`}
          onClick={() => handleClick(name)}
        >
          {name}
        </button>
      ))}
    </div>
  );
};
