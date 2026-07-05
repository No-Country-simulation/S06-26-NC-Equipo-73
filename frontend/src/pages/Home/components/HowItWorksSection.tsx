import { motion } from "framer-motion";
import Section from "../../../components/ui/Section";

const steps = [
  { num: "01", title: "Seleccionar región", desc: "Elegí el territorio que querés analizar en el mapa interactivo." },
  { num: "02", title: "Visualizar indicadores", desc: "Accedé a métricas integradas de conectividad, empleo y más." },
  { num: "03", title: "Realizar consulta", desc: "Usá lenguaje natural para explorar relaciones entre variables." },
  { num: "04", title: "Obtener análisis", desc: "Recibí un informe contextualizado con patrones y alertas." },
  { num: "05", title: "Generar decisiones", desc: "Traducí los hallazgos en políticas públicas basadas en evidencia." },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function HowItWorksSection() {
  return (
    <Section
      id="como-funciona"
      title="Cómo Funciona"
      subtitle="Del dato a la decisión en cinco movimientos."
      style={{ backgroundColor: "var(--bg-surface)", color: "var(--light-text-body)" }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="flex flex-col lg:flex-row gap-8 lg:gap-6 lg:items-stretch"
      >
        {steps.map((s) => (
          <motion.div
            key={s.num}
            variants={itemAnim}
            className="flex flex-row lg:flex-col items-start gap-6 lg:gap-4 lg:flex-1"
          >
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm text-lg font-bold"
              style={{
                backgroundColor: "var(--primary-accent)",
                color: "var(--text-primary)",
              }}
            >
              {s.num}
            </div>
            <div className="flex flex-col gap-2 pt-2 lg:pt-0">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {s.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-16 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--color-secondary)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1 }}
      >
        <span>Flujo de datos</span>
        <motion.span
          animate={{ x: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          →
        </motion.span>
        <span>Análisis continuo</span>
      </motion.div>
    </Section>
  );
}
