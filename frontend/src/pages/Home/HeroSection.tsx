import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import BackgroundCanvas from "./BackgroundCanvas";

export default function HeroSection() {
  return (
    <section
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      <BackgroundCanvas />

      <div className="relative z-10 mx-auto grid h-full max-w-7xl grid-cols-1 items-center px-6 md:grid-cols-2 md:px-16 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h1
            className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl"
            style={{ color: "var(--text-primary)" }}
          >
            Comprender una región es el primer paso para transformarla.
          </h1>

          <p
            className="mt-6 max-w-xl text-base leading-relaxed md:text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            App BiT integra datos de conectividad, empleo, formación y salud
            mental para ayudar a los gestores públicos a identificar
            desigualdades antes de que se conviertan en problemas estructurales.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Button variant="primary">Explorar Indicadores</Button>
            <Button variant="ghost">Ver Mapa Territorial</Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="hidden items-center justify-center md:flex"
        >
          <svg
            viewBox="0 0 500 500"
            className="h-auto w-full max-w-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <motion.circle
              cx="250"
              cy="250"
              r="160"
              stroke="var(--primary-accent)"
              strokeWidth="1"
              strokeDasharray="4 6"
              fill="none"
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />
            <motion.ellipse
              cx="250"
              cy="250"
              rx="200"
              ry="80"
              stroke="var(--border-subtle)"
              strokeWidth="0.8"
              fill="none"
              initial={{ rotate: 0 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            />
            <motion.ellipse
              cx="250"
              cy="250"
              rx="80"
              ry="200"
              stroke="var(--border-subtle)"
              strokeWidth="0.8"
              fill="none"
              initial={{ rotate: 0 }}
              animate={{ rotate: -360 }}
              transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            />
            {[
              [250, 90],
              [250, 410],
              [90, 250],
              [410, 250],
              [137, 137],
              [363, 363],
              [363, 137],
              [137, 363],
            ].map(([cx, cy], i) => (
              <motion.circle
                key={i}
                cx={cx}
                cy={cy}
                r={6}
                fill="var(--primary-accent)"
                initial={{ opacity: 0.4, scale: 0.8 }}
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
            {[180, 320].map((cx, i) => (
              <motion.circle
                key={`inner-${i}`}
                cx={cx}
                cy={250}
                r={4}
                fill="var(--heatmap-hot)"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeInOut",
                }}
              />
            ))}
            <motion.path
              d="M250 90 C 290 140, 310 200, 320 250"
              stroke="var(--heatmap-mid)"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M250 410 C 210 360, 190 300, 180 250"
              stroke="var(--heatmap-mid)"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M90 250 C 140 210, 200 190, 250 180"
              stroke="var(--heatmap-mid)"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M410 250 C 360 290, 300 310, 250 320"
              stroke="var(--heatmap-mid)"
              strokeWidth="1.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <text
              x="250"
              y="252"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--text-primary)"
              fontSize="10"
              fontWeight="600"
              letterSpacing="4"
              opacity="0.5"
            >
              APPBIT
            </text>
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
