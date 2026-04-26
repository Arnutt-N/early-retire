"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Elevation = "e1" | "e2" | "e3" | "e4";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  gradientHeader?: boolean;
  elevation?: Elevation;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const elevationClass: Record<Elevation, string> = {
  e1: "shadow-[var(--shadow-e1)]",
  e2: "shadow-[var(--shadow-e2)]",
  e3: "shadow-[var(--shadow-e3)]",
  e4: "shadow-[var(--shadow-e4)]",
};

const paddingClass: Record<"none" | "sm" | "md" | "lg", string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  header,
  footer,
  gradientHeader,
  elevation = "e2",
  hover = true,
  padding = "md",
  className,
  ...rest
}: CardProps) {
  const reduced = useReducedMotion();
  
  return (
    <motion.div
      {...rest}
      whileHover={hover && !reduced ? { y: -2, scale: 1.005 } : undefined}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow duration-200",
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
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
              : "border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50",
          )}
        >
          {header}
        </div>
      )}
      <div className={cn(paddingClass[padding])}>{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">{footer}</div>
      )}
    </motion.div>
  );
}
