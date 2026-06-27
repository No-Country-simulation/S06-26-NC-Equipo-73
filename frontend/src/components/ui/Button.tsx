import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "ghost" | "bigPrimary" | "bigGhost";
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-sm font-medium tracking-wide transition-all duration-300 cursor-pointer select-none";

const variants = {
  primary:
    "border border-transparent",
  ghost:
    "border",
  bigPrimary:
    "border border-transparent px-20 py-4",
  bigGhost:
    "border border-b-5 border-r-5 px-20 py-4", // border-t-0 border-l-0
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
        backgroundColor: variant === "primary" || variant === "bigPrimary" ? "var(--primary-accent)" : "transparent",
        color: variant === "primary" || variant === "bigPrimary" ? "var(--bg-main)" : "var(--primary-accent)",
        borderColor: variant === "ghost" || variant === "bigGhost" ? "var(--primary-accent)" : undefined,
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
