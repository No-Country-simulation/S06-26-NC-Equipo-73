import { motion } from "framer-motion";
import Section from "../../components/ui/Section";

const nodes = [
  { label: "Conectividad", color: "var(--heatmap-cold)" },
  { label: "Movilidad", color: "var(--heatmap-mid)" },
  { label: "Empleo", color: "var(--primary-accent)" },
  { label: "Formación", color: "var(--heatmap-mid)" },
  { label: "Salud Mental", color: "var(--heatmap-hot)" },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 24" className="h-6 w-4" fill="none" stroke="var(--primary-accent)" strokeWidth="1.2">
      <motion.path
        d="M8 0v16M8 16l-5-5M8 16l5-5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </svg>
  );
}

export default function IntelligenceSection() {
  return (
    <Section
      title="Inteligencia Territorial"
      subtitle="App BiT conecta las dimensiones clave del desarrollo regional en un sistema de análisis unificado."
      dark
    >
      <div className="flex flex-col items-center gap-0">
        {nodes.map((n, i) => (
          <motion.div
            key={n.label}
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
          >
            <motion.div
              className="relative flex h-20 w-56 items-center justify-center rounded-sm font-semibold tracking-wide"
              style={{
                backgroundColor: n.color,
                color: n.label === "Conectividad" || n.label === "Salud Mental"
                  ? "var(--text-primary)"
                  : "var(--bg-main)",
                border: "1px solid var(--border-subtle)",
              }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="absolute -left-2 h-3 w-3 rounded-full"
                style={{ backgroundColor: "var(--primary-accent)" }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
              {n.label}
            </motion.div>

            {i < nodes.length - 1 && (
              <div className="flex h-12 items-center justify-center">
                <ArrowIcon />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.p
        className="mx-auto mt-16 max-w-2xl text-center text-sm leading-relaxed"
        style={{ color: "var(--border-subtle)" }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        Cada indicador se analiza en relación con los demás, revelando patrones
        que ningún dashboard tradicional puede mostrar.
      </motion.p>
    </Section>
  );
}
