import { Link } from "react-router-dom";

const navItems = [
  { label: "Nosotros", to: "/#nosotros" },
  { label: "Módulos", to: "/#modulos" },
  { label: "Cómo funciona", to: "/#como-funciona" },
  { label: "Datos", to: "/docs" },
  { label: "Bit app", to: "/#bit-app" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(99,14,6,0.08)] bg-[rgba(255,245,201,0.95)] backdrop-blur-xl shadow-sm shadow-[rgba(99,14,6,0.08)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 md:px-10">
        <Link
          to="/"
          className="flex items-center gap-3 transition-all duration-200 hover:opacity-90"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-[#630e06] via-[#e6af00] to-[#d7f7e1] text-white shadow-lg shadow-[#630e0680]">
            <span className="text-lg font-black">B</span>
          </div>
          <div className="leading-none">
            <p
              className="text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: "var(--text-primary)" }}
            >
              BiT
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Inteligencia Territorial
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium transition duration-200 hover:bg-[var(--color-primary)] hover:text-white"
              style={{ color: "var(--text-primary)" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/docs"
          className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[rgba(99,14,6,0.25)] transition duration-200 hover:opacity-90"
        >
          Ver datos
        </Link>
      </div>
    </header>
  );
}
