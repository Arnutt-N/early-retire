"use client";

import { useEffect } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { formatNumber } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  /** Decimal places to render. Default 0 (rounded to whole number). */
  decimals?: number;
  /** Animation duration in seconds. Default 1.2s; ignored when prefers-reduced-motion. */
  duration?: number;
  className?: string;
}

/**
 * Counts up from 0 to `value` on mount and on subsequent value changes.
 * Honors `prefers-reduced-motion` — under reduced-motion the value snaps without animating.
 */
export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1.2,
  className,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);
  const display = useTransform(motionValue, (latest) => {
    const rounded =
      decimals > 0
        ? Number(latest.toFixed(decimals))
        : Math.round(latest);
    return formatNumber(rounded, decimals);
  });

  useEffect(() => {
    if (reduced) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [value, duration, motionValue, reduced]);

  return <motion.span className={className}>{display}</motion.span>;
}
