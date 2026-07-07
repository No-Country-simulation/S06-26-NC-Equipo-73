import { motion } from "framer-motion";
import Section from "../../../components/ui/Section";

interface MotorProps {
  index: number;
  title: string;
  metric: string;
  desc: string;
  accent: string;
}

function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 24" className="mt-3 h-6 w-full" fill="none">
      <motion.path
        d="M0 20 Q 10 8, 20 16 T 40 8 T 60 14 T 80 4"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      <motion.circle
        cx="80"
        cy="4"
        r="2"
        fill={color}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5 }}
      />
    </svg>
  );
}

const motors: MotorProps[] = [
  { index: 0, title: "Formación", metric: "+127%", desc: "Acceso a programas educativos por región", accent: "var(--color-secondary)" },
  { index: 1, title: "Empleabilidad", metric: "86.3%", desc: "Tasa de inserción laboral por cluster productivo", accent: "var(--primary-accent)" },
  { index: 2, title: "Experiencias Estructurantes", metric: "243K", desc: "Trayectorias de jóvenes monitoreadas", accent: "var(--color-secondary)" },
  { index: 3, title: "Mentorías", metric: "1,847", desc: "Conexiones activas entre mentores y participantes", accent: "var(--primary-accent)" },
  { index: 4, title: "Salud Mental", metric: "-32%", desc: "Reducción de brecha de acceso a atención", accent: "var(--color-secondary)" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

export default function MotorsSection() {
  return (
    <Section
      id="modulos"
      title="Los 5 Motores de Análisis"
      subtitle="Cada motor despliega inteligencia especializada para cubrir todas las dimensiones del desarrollo territorial."
      style={{ backgroundColor: "var(--bg-surface)", color: "var(--light-text-body)" }}
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        {motors.map((m) => (
          <motion.div
            key={m.title}
            // variants={itemAnim}
            className="group relative flex flex-col rounded-sm p-6 transition-all duration-500"
            style={{
              backgroundColor: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
            }}
            whileHover={{
              y: -6,
              boxShadow: "0 12px 32px rgba(34, 64, 111, 0.15)",
              transition: { duration: 0.3 },
            }}
          >
            <div
              className="mb-4 h-1 w-12 rounded-full transition-all duration-500 group-hover:w-full"
              style={{ backgroundColor: m.accent }}
            />
            <h3
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-secondary)" }}
            >
              {m.title}
            </h3>
            <span
              className="mt-3 text-3xl font-bold tracking-tight"
              style={{ color: m.accent }}
            >
              {m.metric}
            </span>
            <p
              className="mt-2 text-xs leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              {m.desc}
            </p>
            <Sparkline color={m.accent} />
            <motion.div
              className="absolute bottom-3 right-3 h-6 w-6 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ backgroundColor: m.accent }}
            >
              <svg viewBox="0 0 24 24" className="h-full w-full p-1" fill="white">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="white" strokeWidth="1.5" fill="none" />
              </svg>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}
