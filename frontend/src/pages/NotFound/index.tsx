import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import errorImage from "../../assets/error404.webp";
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <main
      className=" flex items-center justify-center"
      style={{
        backgroundColor: "var(--bg-surface)",
        minHeight: "calc(100vh - 80px)",
      }}
    >
      <div className="flex flex-col items-center justify-center gap-5">
        <img src={errorImage} alt="Error 404" className="w-32 h-32" />

        <div className="text-3xl font-bold text-primary">404 ERROR</div>
        <div className="text-primary text-4xl  ">Página no encontrada</div>

        <Button variant="bigGhost" onClick={() => navigate("/")}>
          Volver Al Inicio
        </Button>
      </div>
    </main>
  );
};

export default NotFound;
