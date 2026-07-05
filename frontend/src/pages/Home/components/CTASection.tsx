import { motion } from "framer-motion";
import Button from "../../../components/ui/Button";
import { Search } from "lucide-react";

export default function CTASection() {
  return (
    <section
      className="relative overflow-hidden px-6 py-32 md:px-16 lg:px-24"
      style={{ backgroundColor: "#dee5f2" }}
    >
      {/* Blue light effect at the end (right side) */}
      <div
        className="pointer-events-none absolute -right-0 top-1/2 -translate-y-1/4 h-[500px] w-[500px] rounded-full blur-[30px]"
        style={{
          background:
            "radial-gradient(circle, rgba(90,126,190,0.6) 0%, rgba(34,64,111,0.3) 40%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.h2
          className="text-3xl font-bold leading-tight md:text-4xl lg:text-5xl"
          style={{ color: "var(--text-secondary)" }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          No se trata de visualizar datos.
        </motion.h2>

        <motion.p
          className="mt-6 max-w-xl text-base leading-relaxed md:text-lg"
          style={{ color: "var(--text-secondary)" }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Se trata de identificar oportunidades donde otros solo ven
          estadísticas.
        </motion.p>

        <motion.div
          className="mt-12 flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button variant="bigGhost" theme="light">
            <>
              <Search className="w-4 h-4" />
              ASISTENTE IA
            </>
          </Button>
          <Button variant="bigPrimary" theme="light">
            MAPA INTERACTIVO
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
