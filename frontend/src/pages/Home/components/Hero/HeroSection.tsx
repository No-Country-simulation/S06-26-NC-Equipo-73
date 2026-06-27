import { motion } from "framer-motion";
import Button from "../../../../components/ui/Button";
import HeroMap from "./HeroMap";

export default function HeroSection() {
  return (
    <>
      {/* Desktop: two columns */}
      <section
        className="hidden min-h-screen w-full overflow-hidden lg:grid lg:grid-cols-12"
        style={{ backgroundColor: "var(--bg-main)" }}
      >
        <div className="flex flex-col justify-center lg:col-span-5 pl-16 xl:pl-24 pr-8 lg:pr-10 xl:pr-12">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h1
              className="text-5xl font-bold leading-tight tracking-tight xl:text-7xl"
              style={{ color: "var(--text-primary)" }}
            >
              Inteligencia Territorial y analítica avanzada en un solo lugar
            </h1>

            <div
              className="mt-6 h-1 w-1/4"
              style={{ backgroundColor: "var(--primary-accent)" }}
            />

            <p
              className="mt-8 max-w-2xl text-lg leading-relaxed xl:text-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              App BiT integra datos de conectividad, empleo, formación y salud
              mental para ayudar a los gestores públicos a identificar
              desigualdades antes de que se conviertan en problemas estructurales.
            </p>

            <div className="mt-8 flex gap-4">
              <Button variant="bigGhost">ASISTENTE IA</Button>
              <Button variant="bigPrimary">MAPA INTERACTIVO</Button>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col justify-center lg:col-span-7 pr-16 xl:pr-24 pl-0">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-sm"
            >
              <HeroMap visible />
            </div>

            <p
              className="mt-2 text-md font-semibold text-center "
              style={{ color: "var(--text-secondary)" }}
            >
              Datos precisos para decisiones públicas con impacto real
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mobile: current structure unchanged */}
      <section
        className="relative h-screen w-full overflow-hidden lg:hidden"
        style={{ backgroundColor: "var(--bg-main)" }}
      >
        <HeroMap />

        <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col items-center justify-center px-6 text-center md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center"
          >
            <h1
              className="text-4xl font-bold leading-tight tracking-tight md:text-5xl"
              style={{ color: "var(--text-primary)" }}
            >
              Inteligencia Territorial y analítica avanzada en un solo lugar
            </h1>

            <p
              className="mt-8 max-w-2xl text-base leading-relaxed md:text-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              App BiT integra datos de conectividad, empleo, formación y salud
              mental para ayudar a los gestores públicos a identificar
              desigualdades antes de que se conviertan en problemas estructurales.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Button variant="primary">ASISTENTE IA</Button>
              <Button variant="ghost">MAPA INTERACTIVO</Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
