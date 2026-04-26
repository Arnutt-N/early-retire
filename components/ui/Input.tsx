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
  const isNumeric = type === "number";

  // Render numeric inputs as type="text" with inputMode="decimal" to avoid
  // <input type="number"> browser quirks: step-snapping on blur (30000 → 29998),
  // scroll-wheel mutating values, and up/down arrow keys silently incrementing.
  // Mobile users still get the numeric keyboard via inputMode.
  const renderType = isNumeric ? "text" : type;
  const inputMode = isNumeric ? "decimal" : undefined;
  const pattern = isNumeric ? "[0-9]*[.]?[0-9]*" : undefined;

  // Select-all on focus for numeric fields so typing replaces the leading 0
  // (fixes UX issue: "0" + typed "5" → "05" briefly).
  const handleFocus = isNumeric
    ? (e: FocusEvent<HTMLInputElement>) => e.target.select()
    : undefined;

  // Hide a literal "0" so the placeholder shows instead.
  const displayValue =
    isNumeric && (value === 0 || value === "0") ? "" : value;

  // Filter non-numeric keystrokes so users can't type letters, while still
  // allowing digits, a single decimal point, and an empty string (for clearing).
  const handleChange = isNumeric
    ? (raw: string) => {
        if (raw === "") return onChange("");
        // Allow digits + at most one decimal point.
        const cleaned = raw.replace(/[^\d.]/g, "");
        const firstDot = cleaned.indexOf(".");
        const normalized =
          firstDot === -1
            ? cleaned
            : cleaned.slice(0, firstDot + 1) +
              cleaned.slice(firstDot + 1).replace(/\./g, "");
        onChange(normalized);
      }
    : onChange;

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
          type={renderType}
          inputMode={inputMode}
          pattern={pattern}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder ?? (isNumeric ? "0" : undefined)}
          disabled={disabled}
          min={isNumeric ? undefined : min}
          max={isNumeric ? undefined : max}
          step={isNumeric ? undefined : step}
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
