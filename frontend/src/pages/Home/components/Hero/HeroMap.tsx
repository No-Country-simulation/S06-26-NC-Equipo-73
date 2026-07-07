import { motion } from "framer-motion";
import { mapRegions } from "./mapRegions";
import FlightAnimation from "./FlightAnimation";

interface HeroMapProps {
  visible?: boolean;
}

export default function HeroMap({ visible = false }: HeroMapProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${
        visible ? "opacity-100" : "opacity-[0.52] md:opacity-[0.42]"
      }`}
    >
      <motion.svg
        viewBox="0 0 2000 860"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {mapRegions.map((region) => (
          <path
            key={region.id}
            d={region.d}
            fill="var(--text-primary)"
            fillOpacity={0.55}
            stroke="var(--primary-accent)"
            strokeWidth={0.6}
            strokeOpacity={0.5}
            strokeLinejoin="round"
          />
        ))}
        <FlightAnimation />
      </motion.svg>
    </div>
  );
}
