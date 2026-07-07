import type { Servicio } from "../types";

type Props = {
  servicios: Servicio[];
  setServicios: React.Dispatch<React.SetStateAction<Servicio[]>>;
  disable?: boolean;
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
    "hover:bg-primary/90 hover:scale-105 transition-all duration-300 cursor-pointer";

  return (
    <div className="flex flex-wrap gap-2 sm:gap-4">
      {servicios.map(({ name, isActive, disable}) => (
        <button
          key={name}
          type="button"
          className={`${baseStyle}  ${
            isActive ? "bg-inherit text-primary" : `${hoverStyle} bg-primary text-text-primary`
          } border border-primary  w-auto disabled:cursor-not-allowed disabled:opacity-50`}
          onClick={() => handleClick(name)}
          disabled={disable}
        >
          {name}
        </button>
      ))}
    </div>
  );
};
