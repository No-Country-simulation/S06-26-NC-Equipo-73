import Button from "../../../components/ui/Button";
import type { Servicio } from "../types";

type Props = {
  servicios: Servicio[];
  setServicios: React.Dispatch<React.SetStateAction<Servicio[]>>;
};

export const Buttons = ({ servicios, setServicios }: Props) => {
  const handleClick = (name: string) => {
    setServicios((prev) =>
      prev.map((servicio) =>
        servicio.name === name
          ? { ...servicio, isActive: !servicio.isActive }
          : servicio
      )
    );
  };

  return (
    <div className="flex gap-4">
      {servicios.map(({ name, isActive }) => (
        <Button
          key={name}
          variant={isActive ? "ghost" : "primary"}
          onClick={() => handleClick(name)}
        >
          {name}
        </Button>
      ))}
    </div>
  );
};