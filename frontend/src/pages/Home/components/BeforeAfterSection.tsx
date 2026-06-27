import { motion } from "framer-motion";
import Section from "../../../components/ui/Section";

const before = [
  "Datos fragmentados en Excel sin conexión entre sí.",
  "Reuniones sin evidencia concreta.",
  "Políticas diseñadas por intuición.",
  "Resultados medidos con meses de retraso.",
];

const after = [
  "Plataforma unificada con visualización territorial.",
  "Informes automatizados con correlaciones reales.",
  "Decisiones basadas en evidencia multidimensional.",
  "Monitoreo en tiempo real del impacto.",
];

export default function BeforeAfterSection() {
  return (
    <Section
      title="Antes de Actuar"
      subtitle="Compará el enfoque tradicional con lo que App BiT pone en tus manos."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <motion.div
          className="rounded-sm p-8"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: "var(--heatmap-hot)", color: "var(--bg-main)" }}
            >
              T
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Enfoque Tradicional
            </h3>
          </div>
          <ul className="space-y-4">
            {before.map((b, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-3 text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              >
                <span className="mt-0.5 shrink-0" style={{ color: "var(--heatmap-hot)" }}>✕</span>
                {b}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="rounded-sm p-8"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--primary-accent)",
            boxShadow: "0 0 0 1px var(--primary-accent)",
          }}
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: "var(--primary-accent)", color: "var(--bg-main)" }}
            >
              B
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Con App BiT
            </h3>
          </div>
          <ul className="space-y-4">
            {after.map((a, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-3 text-sm leading-relaxed"
                style={{ color: "var(--text-primary)" }}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              >
                <span className="mt-0.5 shrink-0"
                  style={{ color: "var(--primary-accent)" }}
                >✓</span>
                {a}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </Section>
  );
}
