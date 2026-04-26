"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "success" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: cn(
    "bg-gradient-to-br from-blue-500 to-indigo-600 text-white",
    "shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-700",
    "active:shadow-sm"
  ),
  secondary: cn(
    "bg-gray-100 text-gray-700",
    "hover:bg-gray-200 active:bg-gray-300"
  ),
  outline: cn(
    "bg-white text-gray-700 border-2 border-gray-200",
    "hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
  ),
  ghost: cn(
    "bg-transparent text-gray-600",
    "hover:bg-gray-100 active:bg-gray-200"
  ),
  success: cn(
    "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    "shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-700"
  ),
  danger: cn(
    "bg-gradient-to-br from-red-500 to-rose-600 text-white",
    "shadow-md hover:shadow-lg hover:from-red-600 hover:to-rose-700"
  ),
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-2 text-sm rounded-lg gap-1.5 min-h-[36px]",
  md: "px-5 py-2.5 text-sm rounded-xl gap-2 min-h-[44px]",
  lg: "px-8 py-3.5 text-base rounded-xl gap-2.5 min-h-[52px]",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "right",
  fullWidth,
  loading,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const reduced = useReducedMotion();
  const isDisabled = disabled || loading;
  
  return (
    <motion.button
      {...rest}
      type={type}
      whileTap={!isDisabled && !reduced ? { scale: 0.98 } : undefined}
      whileHover={!isDisabled && !reduced ? { y: -1 } : undefined}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading && (
        <Loader2 size={size === "lg" ? 20 : 16} className="animate-spin" />
      )}
      {icon && iconPosition === "left" && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      {children && <span>{children}</span>}
      {icon && iconPosition === "right" && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </motion.button>
  );
}
