import { motion } from "framer-motion";
import Button from "../../../components/ui/Button";
import HeroMap from "./HeroMap";

export default function HeroSection() {
  return (
    <>
      {/* Desktop: two columns */}
      <section
        className="hidden min-h-screen w-full overflow-hidden lg:grid lg:grid-cols-2"
        style={{ backgroundColor: "var(--bg-main)" }}
      >
        <div className="flex flex-col justify-center px-16 xl:px-24">
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
              className="mt-8 h-px w-1/3"
              style={{ backgroundColor: "var(--primary-accent)" }}
            />

            <p
              className="mt-8 max-w-xl text-lg leading-relaxed xl:text-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              App BiT integra datos de conectividad, empleo, formación y salud
              mental para ayudar a los gestores públicos a identificar
              desigualdades antes de que se conviertan en problemas estructurales.
            </p>

            <div className="mt-10 flex gap-4">
              <Button variant="primary">ASISTENTE IA</Button>
              <Button variant="ghost">MAPA INTERACTIVO</Button>
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col justify-center px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm"
              style={{ border: "1px solid var(--border-subtle)" }}
            >
              <HeroMap visible />
            </div>

            <p
              className="mt-4 text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua.
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
