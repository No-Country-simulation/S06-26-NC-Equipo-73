import { motion } from "framer-motion";
import Section from "../../components/ui/Section";

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
      title="Cómo Funciona"
      subtitle="Del dato a la decisión en cinco movimientos."
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="relative"
      >
        <div
          className="absolute left-6 top-12 hidden h-px lg:block"
          style={{
            left: "calc(10% + 24px)",
            right: "calc(10% + 24px)",
            backgroundColor: "var(--border-subtle)",
          }}
        />

        <div className="grid gap-8 lg:grid-cols-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              variants={itemAnim}
              className="relative flex flex-col lg:items-center lg:text-center"
            >
              <div className="flex items-center gap-4 lg:flex-col lg:gap-3">
                <motion.div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: "var(--primary-accent)",
                    color: "var(--bg-main)",
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {s.num}
                </motion.div>

                {i < steps.length - 1 && (
                  <motion.div
                    className="hidden h-px flex-1 lg:block"
                    style={{ backgroundColor: "var(--border-subtle)" }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                )}
              </div>

              <div className="mt-4 lg:mt-6">
                <h3
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {s.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mx-auto mt-16 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--primary-accent)" }}
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
      </motion.div>
    </Section>
  );
}
