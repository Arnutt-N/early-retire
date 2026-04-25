"use client";

import { useState, useRef, useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { parseThaiDate, toBE, daysInMonth, cn } from "@/lib/utils";

export interface CalendarPickerTHProps {
  label?: string;
  value: string | null;
  onChange: (isoDate: string | null) => void;
  error?: string;
  helper?: string;
  required?: boolean;
}

const THAI_MONTHS_LONG = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
] as const;

const THAI_WEEKDAYS_SHORT = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."] as const;

function firstOfMonth(ceYear: number, monthZeroBased: number): Date {
  return new Date(ceYear, monthZeroBased, 1);
}

/**
 * Day-of-week index Mon=0 .. Sun=6 (Thai convention).
 * JS native is Sun=0 .. Sat=6, so shift by +6 mod 7.
 */
function thaiDow(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function partsFrom(value: string | null): { day: string; month: string; beYear: string } {
  if (!value) return { day: "", month: "", beYear: "" };
  const d = new Date(value);
  if (isNaN(d.getTime())) return { day: "", month: "", beYear: "" };
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: (d.getMonth() + 1).toString().padStart(2, "0"),
    beYear: toBE(d.getFullYear()).toString(),
  };
}

export default function CalendarPickerTH({
  label,
  value,
  onChange,
  error,
  helper,
  required,
}: CalendarPickerTHProps) {
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [localError, setLocalError] = useState<string>("");

  // viewMonth follows `value` by default; user calendar-nav sets an override.
  // Day pick / keyboard validation success clears the override so it tracks `value` again.
  // This avoids `setState` inside `useEffect` (react-hooks/set-state-in-effect rule).
  const [viewMonthOverride, setViewMonthOverride] = useState<Date | null>(null);

  const viewMonth = useMemo<Date>(() => {
    if (viewMonthOverride) return viewMonthOverride;
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return firstOfMonth(d.getFullYear(), d.getMonth());
    }
    const now = new Date();
    return firstOfMonth(now.getFullYear(), now.getMonth());
  }, [viewMonthOverride, value]);

  // DOM-ref sync: when `value` changes externally (retirement-option auto-fill, calendar pick),
  // mirror it into the keyboard input refs. Pure DOM mutation — no setState here.
  useEffect(() => {
    const parts = partsFrom(value);
    if (dayRef.current && dayRef.current.value !== parts.day) {
      dayRef.current.value = parts.day;
    }
    if (monthRef.current && monthRef.current.value !== parts.month) {
      monthRef.current.value = parts.month;
    }
    if (yearRef.current && yearRef.current.value !== parts.beYear) {
      yearRef.current.value = parts.beYear;
    }
  }, [value]);

  // Click-outside to close calendar overlay
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const validateAndUpdate = () => {
    const day = dayRef.current?.value ?? "";
    const month = monthRef.current?.value ?? "";
    const beYear = yearRef.current?.value ?? "";
    setLocalError("");

    if (!day && !month && !beYear) {
      onChange(null);
      setViewMonthOverride(null);
      return;
    }
    if (!day || !month || !beYear) return;

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const beYearNum = parseInt(beYear, 10);

    if (dayNum < 1 || dayNum > 31) {
      setLocalError("วันที่ไม่ถูกต้อง");
      return;
    }
    if (monthNum < 1 || monthNum > 12) {
      setLocalError("เดือนไม่ถูกต้อง");
      return;
    }
    if (beYearNum < 2400 || beYearNum > 2600) {
      setLocalError("ปี พ.ศ. ไม่ถูกต้อง");
      return;
    }

    try {
      const date = parseThaiDate(dayNum, monthNum, beYearNum);
      if (isNaN(date.getTime())) {
        setLocalError("วันที่ไม่ถูกต้อง");
        return;
      }
      // Roll-over guard (e.g. "30 ก.พ." silently rolls to March in JS Date)
      if (date.getDate() !== dayNum || date.getMonth() + 1 !== monthNum) {
        setLocalError("วันที่ไม่มีในเดือนนี้");
        return;
      }
      onChange(date.toISOString());
      setViewMonthOverride(null);
    } catch {
      setLocalError("วันที่ไม่ถูกต้อง");
    }
  };

  const handleInput = (e: FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const clean = el.value.replace(/\D/g, "");
    const maxLen = el.placeholder === "ปปปป (พ.ศ.)" ? 4 : 2;
    el.value = clean.slice(0, maxLen);
    validateAndUpdate();
  };

  const goPrevMonth = () => {
    const next = new Date(viewMonth);
    next.setMonth(next.getMonth() - 1);
    setViewMonthOverride(next);
  };
  const goNextMonth = () => {
    const next = new Date(viewMonth);
    next.setMonth(next.getMonth() + 1);
    setViewMonthOverride(next);
  };
  const goPrevYear = () => {
    const next = new Date(viewMonth);
    next.setFullYear(next.getFullYear() - 1);
    setViewMonthOverride(next);
  };
  const goNextYear = () => {
    const next = new Date(viewMonth);
    next.setFullYear(next.getFullYear() + 1);
    setViewMonthOverride(next);
  };

  // Build day cells (memoized — three picker instances share a wizard re-render cycle)
  const dayCells: ReactNode[] = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDow = thaiDow(firstOfMonth(year, month));
    const dayCount = daysInMonth(year, month + 1);
    const selectedDate = value ? new Date(value) : null;
    const isSelectedDay = (d: number): boolean =>
      !!selectedDate &&
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d;
    const today = new Date();
    const isToday = (d: number): boolean =>
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d;

    const cells: ReactNode[] = [];
    for (let i = 0; i < firstDow; i++) {
      cells.push(<div key={`pad-${i}`} className="h-9" />);
    }
    for (let d = 1; d <= dayCount; d++) {
      const sel = isSelectedDay(d);
      const tod = isToday(d);
      cells.push(
        <button
          key={d}
          type="button"
          onClick={() => {
            const picked = new Date(year, month, d);
            onChange(picked.toISOString());
            setViewMonthOverride(null);
            setLocalError("");
            setIsOpen(false);
          }}
          aria-label={`${d} ${THAI_MONTHS_LONG[month]} ${toBE(year)}`}
          aria-current={tod ? "date" : undefined}
          className={cn(
            "h-9 rounded-lg text-sm transition-colors min-w-[36px]",
            sel
              ? "bg-[var(--color-primary)] text-white font-semibold"
              : tod
                ? "bg-[var(--color-primary-light)]/15 text-[var(--color-primary)] font-medium hover:bg-[var(--color-primary-light)]/25"
                : "text-gray-700 hover:bg-gray-100",
          )}
        >
          {d}
        </button>,
      );
    }
    return cells;
  }, [viewMonth, value, onChange]);

  const parts = partsFrom(value);

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium mb-1.5">
          {label}
          {required && <span className="text-[var(--color-accent)] ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={dayRef}
            type="text"
            inputMode="numeric"
            placeholder="วว"
            defaultValue={parts.day}
            onInput={handleInput}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-center focus:outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
          />
        </div>
        <span className="text-gray-400">/</span>
        <div className="relative flex-1">
          <input
            ref={monthRef}
            type="text"
            inputMode="numeric"
            placeholder="ดด"
            defaultValue={parts.month}
            onInput={handleInput}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-center focus:outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
          />
        </div>
        <span className="text-gray-400">/</span>
        <div className="relative flex-[2]">
          <input
            ref={yearRef}
            type="text"
            inputMode="numeric"
            placeholder="ปปปป (พ.ศ.)"
            defaultValue={parts.beYear}
            onInput={handleInput}
            className="w-full px-3 py-2.5 pr-10 rounded-xl border-2 border-gray-200 bg-white text-center focus:outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
          />
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-label="เปิดปฏิทินเลือกวันที่"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <Calendar size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="ปฏิทินเลือกวันที่"
            className="absolute z-50 mt-2 right-0 bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-e3)] p-4 w-[320px] max-w-[calc(100vw-32px)]"
          >
            <div className="flex items-center justify-between mb-3 gap-1">
              <button
                type="button"
                onClick={goPrevYear}
                aria-label="ปีก่อนหน้า"
                className="p-1.5 rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px] text-sm"
              >
                ‹‹
              </button>
              <button
                type="button"
                onClick={goPrevMonth}
                aria-label="เดือนก่อนหน้า"
                className="p-1.5 rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex-1 text-center font-semibold text-sm">
                {THAI_MONTHS_LONG[viewMonth.getMonth()]} {toBE(viewMonth.getFullYear())}
              </div>
              <button
                type="button"
                onClick={goNextMonth}
                aria-label="เดือนถัดไป"
                className="p-1.5 rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                onClick={goNextYear}
                aria-label="ปีถัดไป"
                className="p-1.5 rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px] text-sm"
              >
                ››
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {THAI_WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-xs text-gray-500 py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">{dayCells}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {(error || localError) && (
        <p className="mt-1 text-sm text-[var(--color-accent)]">{error || localError}</p>
      )}
      {helper && !(error || localError) && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
}
