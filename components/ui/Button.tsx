"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode, MouseEvent } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  "aria-label"?: string;
}

const vClasses: Record<Variant, string> = {
  primary:
    "bg-[image:var(--gradient-mesh-primary)] text-white shadow-[var(--shadow-e2)] hover:shadow-[var(--shadow-e3)]",
  secondary:
    "bg-[var(--color-secondary)] text-[var(--color-primary)] hover:bg-[var(--color-secondary-dark)]",
  outline:
    "bg-white text-[var(--color-primary)] border-2 border-[var(--color-primary)] hover:bg-[var(--color-secondary)]",
  ghost:
    "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-secondary)]",
};

const sClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg min-h-[36px]",
  md: "px-5 py-2.5 text-base rounded-xl min-h-[44px]",
  lg: "px-8 py-3.5 text-lg rounded-xl min-h-[52px]",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  fullWidth,
  className,
  disabled,
  type = "button",
  onClick,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const reduced = useReducedMotion();
  const animateOff = disabled || reduced;
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileTap={animateOff ? undefined : { scale: 0.98 }}
      whileHover={animateOff ? undefined : { y: -1 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-shadow duration-[var(--duration-fast)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        vClasses[variant],
        sClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
