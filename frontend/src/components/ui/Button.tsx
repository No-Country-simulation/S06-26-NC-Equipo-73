import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "ghost" | "bigPrimary" | "bigGhost";
  theme?: "light" | "dark";
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer select-none";

const sizes = {
  primary: "border px-20 py-4",
  ghost: "border border-b-5 border-r-5 px-20 py-4",
  bigPrimary: "border px-20 py-4",
  bigGhost: "border border-b-5 border-r-5 px-20 py-4",
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
      className={`${base} ${sizes[variant]} ${className}`}
      style={theme === "dark" ? darkStyles : lightStyles}
      {...props}
    >
      {children}
    </motion.button>
  );
}
