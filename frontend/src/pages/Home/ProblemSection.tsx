import { motion } from "framer-motion";
import Section from "../../components/ui/Section";

const problems = [
  {
    title: "Datos dispersos",
    desc: "La información pública está fragmentada en silos institucionales sin conexión entre sí.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </svg>
    ),
  },
  {
    title: "Decisiones basadas en intuición",
    desc: "Sin una vista integrada, las políticas públicas se diseñan sobre corazonadas en lugar de evidencia.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    title: "Falta de conectividad visible",
    desc: "No existe una representación clara de cómo se relacionan los indicadores entre regiones.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
  },
  {
    title: "Dificultad para cruzar indicadores",
    desc: "Cruzar variables de empleo, conectividad y salud mental requiere procesos manuales que tardan semanas.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
      </svg>
    ),
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function ProblemSection() {
  return (
    <Section
      title="Los datos existen. La visión integrada no."
      subtitle="Los gobiernos generan enormes volúmenes de información, pero sin una plataforma que conecte los puntos, los patrones críticos permanecen invisibles."
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="grid gap-6 md:grid-cols-2"
      >
        {problems.map((p) => (
          <motion.div
            key={p.title}
            variants={item}
            className="group rounded-sm p-8 transition-all duration-500"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
            whileHover={{
              y: -4,
              transition: { duration: 0.3 },
            }}
          >
            <div
              className="mb-6 inline-flex rounded-sm p-3"
              style={{ backgroundColor: "var(--heatmap-cold)", color: "var(--primary-accent)" }}
            >
              {p.icon}
            </div>
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {p.title}
            </h3>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {p.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
