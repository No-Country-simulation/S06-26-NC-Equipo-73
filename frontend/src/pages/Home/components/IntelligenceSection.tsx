import { motion } from "framer-motion";
import Section from "../../../components/ui/Section";

const nodes = [
  {
    label: "Conectividad",
    description:
      "Nos permite enlazar distintas localidades para visualizar cuál de ellas necesita apoyo.",
    gradient: "from-[#22406F] to-[#5a7ebe]",
    icon: (
      <svg
        viewBox="0 0 48 48"
        className="h-16 w-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="24" cy="16" r="4" strokeWidth="1.5" />
        <circle cx="12" cy="38" r="4" strokeWidth="1.5" />
        <circle cx="36" cy="38" r="4" strokeWidth="1.5" />
        <line x1="24" y1="20" x2="12" y2="34" strokeWidth="1.5" />
        <line x1="24" y1="20" x2="36" y2="34" strokeWidth="1.5" />
        <line x1="16" y1="38" x2="32" y2="38" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Movilidad",
    description:
      "Nos permite enlazar distintas localidades para visualizar cuál de ellas necesita apoyo.",
    gradient: "from-[#5a7ebe] to-[#22406F]",
    icon: (
      <svg
        viewBox="0 0 48 48"
        className="h-16 w-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
        <circle cx="36" cy="12" r="3" strokeWidth="1.5" />
        <circle cx="12" cy="36" r="3" strokeWidth="1.5" />
        <circle cx="36" cy="36" r="3" strokeWidth="1.5" />
        <polyline points="15,12 33,12" strokeWidth="1.5" />
        <polyline points="12,15 12,33" strokeWidth="1.5" />
        <polyline points="36,15 36,33" strokeWidth="1.5" />
        <polyline points="15,36 33,36" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Empleo",
    description:
      "Nos permite enlazar distintas localidades para visualizar cuál de ellas necesita apoyo.",
    gradient: "from-[#22406F] to-[#5a7ebe]",
    icon: (
      <svg
        viewBox="0 0 48 48"
        className="h-16 w-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="8" y="20" width="32" height="18" rx="2" strokeWidth="1.5" />
        <path d="M16 20V14a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6" strokeWidth="1.5" />
        <line x1="24" y1="28" x2="24" y2="34" strokeWidth="1.5" />
        <line x1="20" y1="32" x2="28" y2="32" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Formación",
    description:
      "Nos permite enlazar distintas localidades para visualizar cuál de ellas necesita apoyo.",
    gradient: "from-[#5a7ebe] to-[#22406F]",
    icon: (
      <svg
        viewBox="0 0 48 48"
        className="h-16 w-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M24 8L4 18l20 10 20-10L24 8z" strokeWidth="1.5" />
        <path d="M4 27v7l20 10 20-10v-7" strokeWidth="1.5" />
        <path d="M4 18v7l20 10 20-10v-7" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    label: "Salud Mental",
    description:
      "Nos permite enlazar distintas localidades para visualizar cuál de ellas necesita apoyo.",
    gradient: "from-[#22406F] to-[#5a7ebe]",
    icon: (
      <svg
        viewBox="0 0 48 48"
        className="h-16 w-16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M24 6C14.06 6 6 14.06 6 24s8.06 18 18 18 18-8.06 18-18S33.94 6 24 6z"
          strokeWidth="1.5"
        />
        <path d="M16 24h2l3-5 3 10 3-10 3 5h2" strokeWidth="1.5" />
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

const itemAnim = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

export default function IntelligenceSection() {
  return (
    <Section
      title="Inteligencia Territorial"
      subtitle="App BiT conecta las dimensiones clave del desarrollo regional en un sistema de análisis unificado."
      style={{
        background:
          "linear-gradient(90deg, #002654 0%, #1a4a7a 50%, #002654 100%)",
      }}
      dark
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-6 md:grid-cols-5"
      >
        {nodes.map((n) => (
          <motion.div
            key={n.label}
            variants={itemAnim}
            className="flex flex-col overflow-hidden rounded-sm"
            style={{
              backgroundColor: "var(--dark-card-bg)",
              border: "1px solid var(--dark-card-border)",
            }}
          >
            <div
              className={`flex h-40 items-center justify-center bg-gradient-to-br ${n.gradient}`}
              style={{ color: "#ffffff" }}
            >
              {n.icon}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <h3 className="text-base font-semibold text-white">{n.label}</h3>
              <p className="text-sm leading-relaxed text-white/75">
                {n.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="mt-16 text-right text-sm leading-relaxed md:text-base text-white/60"
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        Cada indicador se analiza en relación con los demás, revelando patrones
        que ningún dashboard tradicional puede mostrar.
      </motion.p>
    </Section>
  );
}
