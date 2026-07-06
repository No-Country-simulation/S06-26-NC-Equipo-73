import { motion } from "framer-motion";
import Section from "../../components/ui/Section";

export default function HeartSystemSection() {
  return (
    <Section
      title="El Corazón del Sistema"
      subtitle="CDRView: el dataset de referencia que alimenta toda la inteligencia territorial de App BiT."
      dark
    >
      <div className="relative mx-auto flex aspect-[16/10] max-w-4xl items-center justify-center overflow-hidden rounded-sm"
        style={{
          backgroundColor: "rgba(254, 248, 212, 0.04)",
          border: "1px solid rgba(237, 223, 189, 0.2)",
        }}
      >
        <svg viewBox="0 0 800 500" className="h-full w-full" fill="none">
          <motion.path
            d="M100 250 Q 200 80, 400 120 Q 600 160, 700 280 Q 750 340, 680 420 Q 500 480, 300 440 Q 120 400, 100 250Z"
            stroke="var(--primary-accent)"
            strokeWidth="0.8"
            strokeDasharray="3 5"
            fill="rgba(125, 106, 198, 0.05)"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {[
            { cx: 250, cy: 200, r: 35 },
            { cx: 500, cy: 150, r: 40 },
            { cx: 600, cy: 300, r: 30 },
            { cx: 350, cy: 350, r: 45 },
            { cx: 180, cy: 320, r: 25 },
          ].map((ant, i) => (
            <motion.g key={`ant-${i}`}>
              <motion.circle
                cx={ant.cx}
                cy={ant.cy}
                r={ant.r}
                stroke="var(--primary-accent)"
                strokeWidth="0.8"
                fill="rgba(125, 106, 198, 0.08)"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              />
              <motion.circle
                cx={ant.cx}
                cy={ant.cy}
                r={3}
                fill="var(--heatmap-hot)"
                animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
              <motion.circle
                cx={ant.cx}
                cy={ant.cy}
                r={ant.r * 1.3}
                stroke="var(--heatmap-mid)"
                strokeWidth="0.5"
                fill="none"
                animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.05, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
              />
              {[2, 3, 4].map((k) => (
                <motion.circle
                  key={`ring-${i}-${k}`}
                  cx={ant.cx}
                  cy={ant.cy}
                  r={ant.r + k * 12}
                  stroke="var(--border-subtle)"
                  strokeWidth="0.4"
                  fill="none"
                  opacity="0.15"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, delay: i * 0.2 + k * 0.3 }}
                />
              ))}
            </motion.g>
          ))}

          {[
            [250, 200, 500, 150],
            [500, 150, 600, 300],
            [600, 300, 350, 350],
            [350, 350, 180, 320],
            [180, 320, 250, 200],
          ].map(([x1, y1, x2, y2], i) => (
            <motion.line
              key={`conn-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--heatmap-mid)"
              strokeWidth="0.5"
              strokeDasharray="2 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.5 + i * 0.15 }}
            />
          ))}

          <motion.circle
            cx="400"
            cy="240"
            r="6"
            fill="var(--heatmap-hot)"
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.8, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />

          <motion.polygon
            points="580,200 600,180 620,200 600,220"
            fill="var(--primary-accent)"
            opacity="0.3"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.polygon
            points="200,380 220,360 240,380 220,400"
            fill="var(--heatmap-mid)"
            opacity="0.25"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
          />
          <motion.polygon
            points="140,180 155,165 170,180 155,195"
            fill="var(--heatmap-cold)"
            opacity="0.2"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
          />

          <text x="400" y="460" textAnchor="middle" fill="var(--border-subtle)" fontSize="10" letterSpacing="3" opacity="0.4">
            VÍSENT CDRVIEW · RED DE INFRAESTRUCTURA DIGITAL
          </text>
        </svg>
      </div>

      <motion.div
        className="mx-auto mt-10 grid max-w-3xl gap-6 text-center sm:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {[
          { label: "Antenas monitoreadas", value: "12,400+" },
          { label: "Regiones cubiertas", value: "510" },
          { label: "Registros diarios", value: "8.2M" },
        ].map((stat) => (
          <div key={stat.label}>
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--heatmap-mid)" }}
            >
              {stat.value}
            </span>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--border-subtle)" }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>
    </Section>
  );
}
