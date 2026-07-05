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
      style={{
        background:
          "linear-gradient(90deg, #002654 0%, #1a4a7a 50%, #002654 100%)",
      }}
      dark
    >
      <div className="grid gap-8 md:grid-cols-2">
        <motion.div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--dark-card-bg)",
            border: "1px solid var(--dark-card-border)",
          }}
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="mb-6 flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              Enfoque Tradicional
            </h3>
          </div>
          <ul className="space-y-4">
            {before.map((b, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-3 text-sm leading-relaxed text-white/75"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              >
                <span className="mt-0.5 shrink-0 text-white/50">✕</span>
                {b}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "var(--dark-card-bg)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.15)",
          }}
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="mb-6 flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">Con Data Pulse</h3>
          </div>
          <ul className="space-y-4">
            {after.map((a, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-3 text-sm leading-relaxed text-white/75"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              >
                <span className="mt-0.5 shrink-0 text-white/70">✓</span>
                {a}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </Section>
  );
}
