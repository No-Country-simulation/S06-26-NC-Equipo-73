export type City = {
  x: number;
  y: number;
  label: string;
};

export type FlightRoute = {
  id: string;
  from: City;
  to: City;
};

export const cities: Record<string, City> = {
  Tokyo: { x: 1720, y: 280, label: "Tokyo" },
  Paris: { x: 1000, y: 185, label: "Paris" },
  London: { x: 965, y: 165, label: "London" },
  Singapore: { x: 1620, y: 490, label: "Singapore" },
  "São Paulo": { x: 640, y: 720, label: "São Paulo" },
  Madrid: { x: 985, y: 230, label: "Madrid" },
  "Los Angeles": { x: 420, y: 240, label: "Los Angeles" },
  Sydney: { x: 1780, y: 770, label: "Sydney" },
  Dubai: { x: 1295, y: 340, label: "Dubai" },
  Johannesburg: { x: 1140, y: 675, label: "Johannesburg" },
  Toronto: { x: 555, y: 205, label: "Toronto" },
  Frankfurt: { x: 1045, y: 180, label: "Frankfurt" },
  "San Francisco": { x: 400, y: 225, label: "San Francisco" },
  Delhi: { x: 1420, y: 330, label: "Delhi" },
  Nairobi: { x: 1210, y: 510, label: "Nairobi" },
  Moscow: { x: 1185, y: 140, label: "Moscow" },
  Istanbul: { x: 1120, y: 240, label: "Istanbul" },
  "Buenos Aires": { x: 640, y: 785, label: "Buenos Aires" },
  "Mexico City": { x: 500, y: 370, label: "Mexico City" },
  Cairo: { x: 1170, y: 310, label: "Cairo" },
  Lagos: { x: 1045, y: 455, label: "Lagos" },
  Beijing: { x: 1610, y: 230, label: "Beijing" },
  Seoul: { x: 1655, y: 260, label: "Seoul" },
  Bangkok: { x: 1575, y: 420, label: "Bangkok" },
  Mumbai: { x: 1390, y: 370, label: "Mumbai" },
  Rome: { x: 1065, y: 235, label: "Rome" },
  Berlin: { x: 1055, y: 170, label: "Berlin" },
  "New York": { x: 570, y: 235, label: "New York" },
};

export const predefinedRoutes: FlightRoute[] = [
  { id: "tokyo-paris", from: cities.Tokyo, to: cities.Paris },
  { id: "london-singapore", from: cities.London, to: cities.Singapore },
  { id: "sao-paulo-madrid", from: cities["São Paulo"], to: cities.Madrid },
  { id: "los-angeles-sydney", from: cities["Los Angeles"], to: cities.Sydney },
  { id: "dubai-johannesburg", from: cities.Dubai, to: cities.Johannesburg },
  { id: "toronto-frankfurt", from: cities.Toronto, to: cities.Frankfurt },
  { id: "singapore-san-francisco", from: cities.Singapore, to: cities["San Francisco"] },
  { id: "delhi-tokyo", from: cities.Delhi, to: cities.Tokyo },
  { id: "nairobi-beijing", from: cities.Nairobi, to: cities.Beijing },
  { id: "mexico-city-berlin", from: cities["Mexico City"], to: cities.Berlin },
  { id: "mumbai-london", from: cities.Mumbai, to: cities.London },
  { id: "new-york-rome", from: cities["New York"], to: cities.Rome },
  { id: "lagos-buenos-aires", from: cities.Lagos, to: cities["Buenos Aires"] },
  { id: "moscow-bangkok", from: cities.Moscow, to: cities.Bangkok },
  { id: "seoul-istanbul", from: cities.Seoul, to: cities.Istanbul },
  { id: "cairo-sydney", from: cities.Cairo, to: cities.Sydney },
  { id: "san-francisco-tokyo", from: cities["San Francisco"], to: cities.Tokyo },
  { id: "london-los-angeles", from: cities.London, to: cities["Los Angeles"] },
  { id: "paris-delhi", from: cities.Paris, to: cities.Delhi },
  { id: "frankfurt-singapore", from: cities.Frankfurt, to: cities.Singapore },
];

export function generateBezierPath(
  from: City,
  to: City,
  arcHeightFactor?: number
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const factor = arcHeightFactor ?? 0.18 + Math.random() * 0.12;
  const arcHeight = dist * factor;

  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);

  const cp1x = from.x + dx * 0.25 + nx * arcHeight * 0.6;
  const cp1y = from.y + dy * 0.25 + ny * arcHeight * 0.6;
  const cp2x = from.x + dx * 0.75 + nx * arcHeight * 0.6;
  const cp2y = from.y + dy * 0.75 + ny * arcHeight * 0.6;

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}
