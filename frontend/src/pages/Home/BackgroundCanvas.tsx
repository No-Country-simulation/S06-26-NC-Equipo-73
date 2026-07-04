import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulse: number;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  from: number;
  to: number;
}

export default function BackgroundCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;
    const nodes: Node[] = [];
    const particles: Particle[] = [];
    const edges: [number, number][] = [];

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function initNodes() {
      nodes.length = 0;
      particles.length = 0;
      edges.length = 0;

      const count = 45;
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          radius: 1.5 + Math.random() * 3,
          pulse: Math.random() * Math.PI * 2,
        });
      }

      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (Math.sqrt(dx * dx + dy * dy) < Math.min(w, h) * 0.18) {
            edges.push([i, j]);
          }
        }
      }

      for (let e = 0; e < Math.min(edges.length, 12); e++) {
        const [from, to] = edges[e];
        particles.push({
          x: nodes[from].x,
          y: nodes[from].y,
          targetX: nodes[to].x,
          targetY: nodes[to].y,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.006,
          from,
          to,
        });
      }
    }

    function drawGrid() {
      if (!ctx) return;
      const spacing = 48;
      ctx.strokeStyle = "rgba(93, 74, 139, 0.06)";
      ctx.lineWidth = 1;

      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    function drawEdges(_time: number) {
      if (!ctx) return;
      for (const [i, j] of edges) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = Math.max(0, 1 - dist / (Math.min(w, h) * 0.18));

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(125, 106, 198, ${alpha * 0.3})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    function drawNodes(time: number) {
      if (!ctx) return;
      for (const n of nodes) {
        const glow = 0.5 + 0.5 * Math.sin(time * 0.002 + n.pulse);
        const radius = n.radius + glow * 1.2;

        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius * 4);
        grad.addColorStop(0, `rgba(125, 106, 198, ${0.6 + glow * 0.3})`);
        grad.addColorStop(0.4, `rgba(125, 106, 198, ${0.15 + glow * 0.15})`);
        grad.addColorStop(1, "rgba(125, 106, 198, 0)");

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(254, 248, 212, ${0.7 + glow * 0.3})`;
        ctx.fill();
      }
    }

    function drawParticles() {
      if (!ctx) return;
      for (const p of particles) {
        const from = nodes[p.from];
        const to = nodes[p.to];
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        p.x = from.x + (to.x - from.x) * p.progress;
        p.y = from.y + (to.y - from.y) * p.progress;

        const px = p.x;
        const py = p.y;

        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(254, 248, 212, 0.9)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(125, 106, 198, 0.2)";
        ctx.fill();
      }
    }

    function updateNodes() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
    }

    function frame(time: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      updateNodes();
      drawGrid();
      drawEdges(time);
      drawNodes(time);
      drawParticles();

      animId = requestAnimationFrame(frame);
    }

    resize();
    initNodes();
    animId = requestAnimationFrame(frame);

    const onResize = () => {
      resize();
      initNodes();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
