"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface InputProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number" | "date" | "email";
  placeholder?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
  required?: boolean;
  suffix?: ReactNode;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export default function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  helper,
  disabled,
  required,
  suffix,
  min,
  max,
  step,
  className,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1.5">
          {label}
          {required && <span className="text-[var(--color-accent)] ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={cn(
            "w-full px-4 py-3 min-h-[44px] rounded-xl border-2 bg-white transition-colors duration-[var(--duration-fast)]",
            "focus:outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]",
            "disabled:bg-gray-100 disabled:text-gray-400",
            error
              ? "border-[var(--color-accent)]"
              : "border-gray-200 hover:border-gray-300",
            suffix && "pr-12",
            className,
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-[var(--color-accent)]">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
    </div>
  );
}
