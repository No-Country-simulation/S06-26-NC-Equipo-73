import { motion } from "framer-motion";
import Button from "../../../components/ui/Button";

export default function CTASection() {
  return (
    <section
      className="relative overflow-hidden px-6 py-32 text-center md:px-16 lg:px-24"
      style={{ backgroundColor: "var(--text-primary)" }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      >
        <svg className="h-full w-full" fill="none">
          <motion.circle
            cx="20%"
            cy="30%"
            r={120}
            stroke="rgba(211, 199, 233, 0.07)"
            strokeWidth="0.5"
            fill="none"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.circle
            cx="80%"
            cy="60%"
            r={180}
            stroke="rgba(211, 199, 233, 0.06)"
            strokeWidth="0.5"
            fill="none"
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r={80}
            stroke="rgba(211, 199, 233, 0.08)"
            strokeWidth="0.4"
            fill="none"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.08, 0.3] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </svg>
      </motion.div>

      <div className="relative z-10 mx-auto max-w-3xl">
        <motion.h2
          className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl"
          style={{ color: "var(--bg-main)" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          No se trata de visualizar datos.
        </motion.h2>

        <motion.p
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed md:text-lg"
          style={{ color: "var(--bg-main)" }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Se trata de identificar oportunidades donde otros solo ven estadísticas.
        </motion.p>

        <motion.div
          className="mt-12 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button variant="primary">Comenzar Exploración</Button>
          <Button variant="ghost">Acceder al Mapa</Button>
        </motion.div>
      </div>
    </section>
  );
}
