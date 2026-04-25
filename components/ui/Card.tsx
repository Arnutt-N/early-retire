"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Elevation = "e1" | "e2" | "e3" | "e4";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  /** Render the header with the primary gradient. Use sparingly — chrome only. */
  gradientHeader?: boolean;
  elevation?: Elevation;
  /** Hover-lift effect (default: true for backward compat with existing call sites). */
  hover?: boolean;
}

const elevationClass: Record<Elevation, string> = {
  e1: "shadow-[var(--shadow-e1)]",
  e2: "shadow-[var(--shadow-e2)]",
  e3: "shadow-[var(--shadow-e3)]",
  e4: "shadow-[var(--shadow-e4)]",
};

export default function Card({
  children,
  header,
  footer,
  gradientHeader,
  elevation = "e2",
  hover = true,
  className,
  ...rest
}: CardProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      {...rest}
      whileHover={hover && !reduced ? { y: -2 } : undefined}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-[var(--surface-data)] rounded-2xl border border-gray-100 overflow-hidden transition-shadow duration-[var(--duration-fast)]",
        elevationClass[elevation],
        hover && "hover:shadow-[var(--shadow-e3)]",
        className,
      )}
    >
      {header && (
        <div
          className={cn(
            "px-6 py-4",
            gradientHeader
              ? "bg-[image:var(--gradient-mesh-primary)] text-white"
              : "border-b border-gray-100 bg-gray-50/50",
          )}
        >
          {header}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">{footer}</div>
      )}
    </motion.div>
  );
}
