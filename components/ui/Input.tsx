"use client";

import { cn } from "@/lib/utils";
import type { ReactNode, FocusEvent } from "react";

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
  prefix?: ReactNode;
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
  prefix,
  min,
  max,
  step,
  className,
}: InputProps) {
  // For number inputs, select all text on focus so typing replaces the leading 0
  // (fixes UX issue: "0" + typed "5" → "05" briefly)
  const handleFocus =
    type === "number"
      ? (e: FocusEvent<HTMLInputElement>) => e.target.select()
      : undefined;

  // For number inputs, hide a literal "0" so the placeholder shows instead
  const displayValue =
    type === "number" && (value === 0 || value === "0") ? "" : value;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder ?? (type === "number" ? "0" : undefined)}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={cn(
            "w-full px-4 py-3 min-h-[48px] rounded-xl border-2 bg-white transition-all duration-200",
            "text-gray-900 font-medium placeholder:text-gray-400 placeholder:font-normal",
            "focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
            "hover:border-gray-300",
            error
              ? "border-red-300 focus:border-red-500 focus-visible:ring-red-100"
              : "border-gray-200",
            prefix && "pl-10",
            suffix && "pr-14",
            className,
          )}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none font-medium">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="mt-1.5 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
}
