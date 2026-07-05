import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Nosotros", to: "/#nosotros" },
  { label: "Módulos", to: "/#modulos" },
  { label: "Cómo funciona", to: "/#como-funciona" },
  { label: "Datos", to: "/docs" },
  { label: "Bit app", to: "/#bit-app" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 border-b border-[rgba(222,229,242,0.12)] transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(0, 38, 84, 0.85)"
          : "rgba(0, 38, 84, 0.5)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 md:px-10">
        <Link
          to="/"
          className="flex shrink-0 items-center transition-all duration-200 hover:opacity-90"
        >
          <img
            src="./assets/Logo_Data_Pulse.png"
            alt="Logo"
            className="h-10 w-auto object-contain md:h-12"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition duration-200 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
