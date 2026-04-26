import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BE_OFFSET = 543;

export function toCE(beYear: number): number {
  return beYear - BE_OFFSET;
}

export function toBE(ceYear: number): number {
  return ceYear + BE_OFFSET;
}

export function roundUp10(value: number): number {
  return Math.ceil(value / 10) * 10;
}

export function formatNumber(num: number, decimals: number = 0): string {
  if (isNaN(num)) return decimals > 0 ? `0.${"0".repeat(decimals)}` : "0";
  return num.toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatThaiDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const be = d.getFullYear() + BE_OFFSET;
  return `${day}/${month}/${be}`;
}

export function parseThaiDate(day: number, month: number, beYear: number): Date {
  const ceYear = toCE(beYear);
  return new Date(ceYear, month - 1, day);
}

export function getThaiDateParts(
  date: Date | string
): { day: number; month: number; beYear: number } {
  const d = typeof date === "string" ? new Date(date) : date;
  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    beYear: d.getFullYear() + BE_OFFSET,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function dateToISO(date: Date | null): string | null {
  if (!date || isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Snap a date to the most recent salary-round boundary (1 Apr or 1 Oct, BE-year-aligned).
 * Returns the round date <= input.
 */
export function getMostRecentRound(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based; Oct=9, Apr=3
  const day = date.getDate();
  if (month > 9 || (month === 9 && day >= 1)) return new Date(year, 9, 1);
  if (month > 3 || (month === 3 && day >= 1)) return new Date(year, 3, 1);
  return new Date(year - 1, 9, 1);
}

/**
 * Get N salary-round dates going backward from `anchorDate` (most recent first).
 * Rounds happen on 1 April (round 1) and 1 October (round 2) of each year.
 * If `anchorDate` is null, anchors at today.
 *
 * Example: anchor = 1/10/2568 (CE 2025-10-01), count = 6 →
 *   [1/10/2568, 1/4/2568, 1/10/2567, 1/4/2567, 1/10/2566, 1/4/2566]
 */
export function getBackwardRounds(anchorDate: Date | null, count: number = 6): Date[] {
  const anchor = anchorDate ?? new Date();
  const start = getMostRecentRound(anchor);
  const rounds: Date[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < count; i++) {
    rounds.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() - 6);
  }
  return rounds;
}
