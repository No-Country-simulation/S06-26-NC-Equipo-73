// import Button from "../../../components/ui/Button";
import type { Servicio } from "../types";

type Props = {
    servicios: Servicio[];
    setServicios: React.Dispatch<React.SetStateAction<Servicio[]>>;
};

export const Buttons = ({ servicios, setServicios }: Props) => {
    const handleClick = (name: string) => {
        setServicios((prev) =>
            prev.map(
                (servicio) =>
                    // servicio.name === name
                    //   ? { ...servicio, isActive: !servicio.isActive }
                    //   : servicio // => seleccionador de varios servicios
                    ({ ...servicio, isActive: servicio.name === name }), // => selecor de un solo servicio
            ),
        );
    };
    const baseStyle: String =
        " font-bold text-sm px-5 py-3 rounded-md";
    const hoverStyle: String =
        "hover:bg-text-primary/80 hover:scale-105 transition-all duration-300 cursor-pointer";
    return (
        <div className="flex gap-4">
            {servicios.map(({ name, isActive }) => (
                <button
                    key={name}
                    className={`${baseStyle} ${hoverStyle} ${isActive === true ? "bg-iherit text-black" : "bg-text-primary text-white"} border border-text-primary `}
                    onClick={() => handleClick(name)}
                >
                    {name}
                </button>
            ))}
        </div>
    );
};
