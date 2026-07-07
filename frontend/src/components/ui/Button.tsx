import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "ghost" | "bigPrimary" | "bigGhost";
  theme?: "light" | "dark";
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer select-none";

const sizes = {
  primary: "border px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3",
  ghost:
    "border border-b-5 border-r-5 px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-3",
  bigPrimary: "border px-6 py-3 sm:px-10 sm:py-4 md:px-20 md:py-4",
  bigGhost:
    "border border-b-5 border-r-5 px-6 py-3 sm:px-10 sm:py-4 md:px-20 md:py-4",
};

export default function Button({
  variant = "primary",
  theme = "light",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const isPrimary = variant === "primary" || variant === "bigPrimary";

  const lightStyles: Record<string, string | undefined> = {
    backgroundColor: isPrimary ? "var(--primary-accent)" : "transparent",
    color: isPrimary ? "var(--text-primary)" : "var(--primary-accent)",
    borderColor: !isPrimary ? "var(--primary-accent)" : undefined,
  };

  const darkStyles: Record<string, string | undefined> = {
    backgroundColor: isPrimary ? "var(--text-primary)" : "transparent",
    color: isPrimary ? "var(--primary-accent)" : "var(--text-primary)",
    borderColor: !isPrimary ? "var(--text-primary)" : undefined,
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${base} ${sizes[variant] ?? sizes.primary} ${className}`}
      style={theme === "dark" ? darkStyles : lightStyles}
      {...props}
    >
      {children}
    </motion.button>
  );
}
