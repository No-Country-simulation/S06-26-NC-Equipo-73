import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
// import BackgroundCanvas from "./BackgroundCanvas";
import HeroMap from "./HeroMap";

export default function HeroSection() {
  return (
    <section
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      {/* <BackgroundCanvas /> */}
      <HeroMap />

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-col items-center"
        >
          <div
            className="mb-6 inline-block rounded-full px-5 py-1.5 text-xs font-medium uppercase tracking-[0.2em] md:text-sm"
            style={{
              backgroundColor: "var(--border-subtle)",
              color: "var(--primary-accent)",
            }}
          >
            Plataforma de Inteligencia Territorial
          </div>

          <h1
            className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-7xl"
            style={{ color: "var(--text-primary)" }}
          >
            Comprender una región es el primer paso para transformarla.
          </h1>

          <p
            className="mt-8 max-w-2xl text-base leading-relaxed md:text-lg lg:text-xl"
            style={{ color: "var(--text-secondary)" }}
          >
            App BiT integra datos de conectividad, empleo, formación y salud
            mental para ayudar a los gestores públicos a identificar
            desigualdades antes de que se conviertan en problemas estructurales.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button variant="primary">Explorar Indicadores</Button>
            <Button variant="ghost">Ver Mapa Territorial</Button>
          </div>
        </motion.div>
      </div>

   
    </section>
  );
}
