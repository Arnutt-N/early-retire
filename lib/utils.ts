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

export function formatNumber(num: number): string {
  if (isNaN(num)) return "0";
  return num.toLocaleString("th-TH");
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
