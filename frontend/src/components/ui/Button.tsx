import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer select-none";

const variants = {
  primary:
    "border border-transparent",
  ghost:
    "border",
};

export default function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${variants[variant]} ${className}`}
      style={{
        backgroundColor: variant === "primary" ? "var(--primary-accent)" : "transparent",
        color: variant === "primary" ? "var(--bg-main)" : "var(--primary-accent)",
        borderColor: variant === "ghost" ? "var(--primary-accent)" : undefined,
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
