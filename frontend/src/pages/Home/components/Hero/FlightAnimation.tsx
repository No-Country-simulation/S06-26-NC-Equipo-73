import { motion } from "framer-motion";
import { useFlightAnimation, type PlaneState } from "../useFlightAnimation";

function AirplaneShape() {
  return (
    <g transform="translate(-14, -14)">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 408 432"><path fill="var(--primary-accent)" d="M175 152zm230 149l-170-53v117l42 32v32l-74-21l-75 21v-32l43-32V248L0 301v-42l171-107V35q0-14 9-23t22.5-9t23 9t9.5 23v117l170 107v42z"/></svg>
    </g>
  );
}
{/* <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16"><path fill="#111111" d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918l-.375 2.253l1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318l-.376-2.253l-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849Z"/></svg> */}

function Glow() {
  return (
    <motion.circle
      cx={0}
      cy={0}
      r={18}
      fill="var(--primary-accent)"
      opacity={0.12}
      style={{ filter: "blur(6px)" }}
    />
  );
}

function Trail({ path, progress }: { path: string; progress: number }) {
  return (
    <motion.path
      d={path}
      stroke="var(--primary-accent)"
      strokeWidth={1.2}
      strokeLinecap="round"
      fill="none"
      strokeDasharray="4 6"
      opacity={0.35}
      style={{
        pathLength: progress,
      }}
    />
  );
}

const microConfig = (seed: number) => ({
  rotAmplitude: 0.3 + (seed % 3) * 0.1,
  floatAmplitude: 0.4 + (seed % 4) * 0.15,
  breathAmplitude: 0.04 + (seed % 5) * 0.01,
  speed: 0.8 + (seed % 7) * 0.15,
});

function Plane({
  plane,
  index,
}: {
  plane: PlaneState & { x: number; y: number; angle: number };
  index: number;
}) {
  const micro = microConfig(index);

  const elapsed = (plane.now - plane.startTime) / 1000;
  const flightElapsed = plane.waiting ? (plane.waitEndTime - plane.startTime) / 1000 : elapsed;
  const t = plane.waiting ? flightElapsed : elapsed;

  const rotOffset =
    Math.sin(t * micro.speed * 2 + index) * micro.rotAmplitude;
  const floatOffset =
    Math.sin(t * micro.speed * 1.7 + index * 1.3) * micro.floatAmplitude;
  const breath =
    0.9 +
    Math.sin(t * micro.speed + index * 0.7) * micro.breathAmplitude;

  const angle = plane.waiting ? 0 : plane.angle;

  return (
    <g>
      {!plane.waiting && (
        <Trail path={plane.path} progress={plane.progress} />
      )}
      <motion.g
        style={{
          x: plane.x,
          y: plane.y + floatOffset,
          rotate: angle + 90 + rotOffset,
          opacity: breath,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.5 }}
      >
        <Glow />
        <AirplaneShape />
      </motion.g>
    </g>
  );
}

export default function FlightAnimation() {
  const { planePositions } = useFlightAnimation(4);

  return (
    <g>
      {planePositions.map((plane, i) => (
        <Plane key={plane.id} plane={plane} index={i} />
      ))}
    </g>
  );
}
