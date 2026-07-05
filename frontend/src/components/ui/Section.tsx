import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";

interface SectionProps {
  id?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
  style?: CSSProperties;
}

export default function Section({
  id,
  title,
  subtitle,
  children,
  className = "",
  dark = false,
  style,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative px-6 py-24 md:px-16 lg:px-24 ${className}`}
      style={{
        backgroundColor: dark ? "var(--text-primary)" : "var(--bg-main)",
        color: dark ? "var(--bg-main)" : "var(--text-primary)",
        ...style,
      }}
    >
      <div className="mx-auto max-w-7xl">
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold tracking-tight md:text-4xl"
            style={{
              color: dark ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            {title}
          </motion.h2>
        )}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-4 max-w-2xl text-lg leading-relaxed"
            style={{
              color: dark ? "var(--text-primary)" : "var(--text-secondary)",
            }}
          >
            {subtitle}
          </motion.p>
        )}
        <div className={title || subtitle ? "mt-12" : ""}>{children}</div>
      </div>
    </section>
  );
}
