"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Required for ARIA radiogroup labelling. Use a concise, descriptive label. */
  "aria-label": string;
  fullWidth?: boolean;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  fullWidth,
}: SegmentedControlProps<T>) {
  const reduced = useReducedMotion();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusByIndex = (idx: number) => {
    const wrapped = ((idx % options.length) + options.length) % options.length;
    buttonRefs.current[wrapped]?.focus();
    onChange(options[wrapped].value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusByIndex(idx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusByIndex(idx - 1);
        break;
      case "Home":
        e.preventDefault();
        focusByIndex(0);
        break;
      case "End":
        e.preventDefault();
        focusByIndex(options.length - 1);
        break;
    }
  };

  // Decide which radio carries tabIndex=0. Per ARIA radiogroup spec, the selected
  // radio is in the tab order; if none selected, the first radio takes the slot.
  const tabbableIndex = (() => {
    if (value === null) return 0;
    const found = options.findIndex((o) => o.value === value);
    return found >= 0 ? found : 0;
  })();

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex bg-gray-100 rounded-xl p-1 gap-1",
        fullWidth && "w-full",
      )}
    >
      {options.map((opt, idx) => {
        const selected = opt.value === value;
        return (
          <motion.button
            key={opt.value}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={idx === tabbableIndex ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            whileTap={reduced ? undefined : { scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
              "min-h-[44px] transition-colors duration-[var(--duration-fast)]",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]",
              selected
                ? "bg-white text-[var(--color-primary)] shadow-[var(--shadow-e1)]"
                : "text-gray-600 hover:text-gray-800",
            )}
          >
            {opt.icon}
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}
