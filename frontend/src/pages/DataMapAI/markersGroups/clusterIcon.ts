import L from "leaflet";

type ClusterOffset = { x: number; y: number };

export const createSharedClusterIcon = (
  cluster: { getChildCount: () => number },
  offset: ClusterOffset = { x: 0, y: 0 },
) => {
  const count = cluster.getChildCount();

  const { size, fontSize, from, to } =
    count >= 50
      ? { size: 56, fontSize: 15, from: "#002654", to: "#0f2a4b" }
      : count >= 10
        ? { size: 44, fontSize: 13, from: "#22406f", to: "#5a7ebe" }
        : { size: 36, fontSize: 12, from: "#22406f", to: "#5a7ebe" };

  const style = [
    "display:flex",
    "align-items:center",
    "justify-content:center",
    `width:${size}px`,
    `height:${size}px`,
    "border-radius:9999px",
    "color:white",
    "font-weight:700",
    `font-size:${fontSize}px`,
    "border:2px solid rgba(255,255,255,0.25)",
    "box-shadow:0 8px 20px rgba(0,0,0,0.35)",
    `background:linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
  ].join(";");

  return L.divIcon({
    html: `<div style="${style}">${count}</div>`,
    className: "",
    iconSize: L.point(size, size, true),
    iconAnchor: [size / 2 + offset.x, size / 2 + offset.y],
  });
};
