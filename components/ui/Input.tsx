"use client";

import { ReactNode } from "react";

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
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
          {label}
          {required && <span className="text-[var(--danger)] ml-1">*</span>}
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
          className={`w-full px-4 py-2.5 rounded-xl border-2 bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] disabled:bg-gray-100 disabled:text-gray-400 ${error ? "border-[var(--danger)]" : "border-gray-200 hover:border-gray-300 focus:border-[var(--primary)]"} ${suffix ? "pr-12" : ""}`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{suffix}</div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-[var(--text-muted)]">{helper}</p>}
    </div>
  );
}
