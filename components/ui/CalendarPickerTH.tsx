"use client";

import { useState, useRef, useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
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

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
] as const;

const THAI_WEEKDAYS_SHORT = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"] as const;

function firstOfMonth(ceYear: number, monthZeroBased: number): Date {
  return new Date(ceYear, monthZeroBased, 1);
}

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

function formatDisplayDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const beYear = toBE(d.getFullYear());
  return `${day} ${month} ${beYear}`;
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
  const [viewMonthOverride, setViewMonthOverride] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const viewMonth = useMemo<Date>(() => {
    if (viewMonthOverride) return viewMonthOverride;
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return firstOfMonth(d.getFullYear(), d.getMonth());
    }
    const now = new Date();
    return firstOfMonth(now.getFullYear(), now.getMonth());
  }, [viewMonthOverride, value]);

  useEffect(() => {
    if (!isEditing) {
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
    }
  }, [value, isEditing]);

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
      setIsEditing(false);
      return;
    }
    if (!day || !month || !beYear) return;

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const beYearNum = parseInt(beYear, 10);

    if (dayNum < 1 || dayNum > 31) {
      setLocalError("วันที่ไม่ถูกต้อง (1-31)");
      return;
    }
    if (monthNum < 1 || monthNum > 12) {
      setLocalError("เดือนไม่ถูกต้อง (1-12)");
      return;
    }
    if (beYearNum < 2400 || beYearNum > 2700) {
      setLocalError("ปี พ.ศ. ไม่ถูกต้อง (2400-2700)");
      return;
    }

    try {
      const date = parseThaiDate(dayNum, monthNum, beYearNum);
      if (isNaN(date.getTime())) {
        setLocalError("วันที่ไม่ถูกต้อง");
        return;
      }
      if (date.getDate() !== dayNum || date.getMonth() + 1 !== monthNum) {
        setLocalError("วันที่ไม่มีในเดือนนี้");
        return;
      }
      onChange(date.toISOString());
      setViewMonthOverride(null);
      setIsEditing(false);
    } catch {
      setLocalError("วันที่ไม่ถูกต้อง");
    }
  };

  const handleInput = (e: FormEvent<HTMLInputElement>, type: 'day' | 'month' | 'year') => {
    setIsEditing(true);
    const el = e.currentTarget;
    const clean = el.value.replace(/\D/g, "");
    const maxLen = type === 'year' ? 4 : 2;
    el.value = clean.slice(0, maxLen);
    
    // Auto-focus next field
    if (type === 'day' && clean.length === 2 && monthRef.current) {
      monthRef.current.focus();
      monthRef.current.select();
    } else if (type === 'month' && clean.length === 2 && yearRef.current) {
      yearRef.current.focus();
      yearRef.current.select();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        validateAndUpdate();
      }
    }, 100);
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
      cells.push(<div key={`pad-${i}`} className="h-10" />);
    }
    for (let d = 1; d <= dayCount; d++) {
      const sel = isSelectedDay(d);
      const tod = isToday(d);
      cells.push(
        <motion.button
          key={d}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const picked = new Date(year, month, d);
            onChange(picked.toISOString());
            setViewMonthOverride(null);
            setLocalError("");
            setIsOpen(false);
            setIsEditing(false);
          }}
          aria-label={`${d} ${THAI_MONTHS_LONG[month]} ${toBE(year)}`}
          aria-current={tod ? "date" : undefined}
          className={cn(
            "h-10 w-10 rounded-xl text-sm font-medium transition-all duration-150",
            sel
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md"
              : tod
                ? "bg-blue-50 text-blue-600 font-semibold ring-2 ring-blue-200"
                : "text-gray-700 hover:bg-gray-100",
          )}
        >
          {d}
        </motion.button>,
      );
    }
    return cells;
  }, [viewMonth, value, onChange]);

  const parts = partsFrom(value);
  const hasValue = !!value;

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className={cn(
        "relative flex items-center gap-1 p-1 rounded-xl border-2 bg-white transition-all duration-200",
        error || localError
          ? "border-red-300 focus-within:border-red-500"
          : "border-gray-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
      )}>
        {/* Day Input */}
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          placeholder="วว"
          defaultValue={parts.day}
          onInput={(e) => handleInput(e, 'day')}
          onBlur={handleBlur}
          onFocus={() => setIsEditing(true)}
          aria-label="วันที่"
          className="w-12 px-2 py-2.5 text-center text-sm font-medium bg-transparent focus:outline-none placeholder:text-gray-300"
        />
        
        <span className="text-gray-300 font-light">/</span>
        
        {/* Month Input */}
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          placeholder="ดด"
          defaultValue={parts.month}
          onInput={(e) => handleInput(e, 'month')}
          onBlur={handleBlur}
          onFocus={() => setIsEditing(true)}
          aria-label="เดือน"
          className="w-12 px-2 py-2.5 text-center text-sm font-medium bg-transparent focus:outline-none placeholder:text-gray-300"
        />
        
        <span className="text-gray-300 font-light">/</span>
        
        {/* Year Input */}
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          placeholder="พ.ศ."
          defaultValue={parts.beYear}
          onInput={(e) => handleInput(e, 'year')}
          onBlur={handleBlur}
          onFocus={() => setIsEditing(true)}
          aria-label="ปี พ.ศ."
          className="flex-1 min-w-[60px] px-2 py-2.5 text-center text-sm font-medium bg-transparent focus:outline-none placeholder:text-gray-300"
        />

        {/* Clear Button */}
        {hasValue && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setLocalError("");
              if (dayRef.current) dayRef.current.value = "";
              if (monthRef.current) monthRef.current.value = "";
              if (yearRef.current) yearRef.current.value = "";
            }}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="ล้างวันที่"
          >
            <X size={16} />
          </button>
        )}

        {/* Calendar Button */}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="เปิดปฏิทินเลือกวันที่"
          className={cn(
            "p-2.5 rounded-lg transition-all duration-200",
            isOpen
              ? "bg-blue-500 text-white"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          )}
        >
          <Calendar size={18} />
        </button>
      </div>

      {/* Display formatted date */}
      {hasValue && !isEditing && !localError && (
        <p className="mt-1.5 text-xs text-blue-600 font-medium">
          {formatDisplayDate(value)}
        </p>
      )}

      {/* Calendar Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="ปฏิทิน พ.ศ."
            className="absolute z-50 mt-2 right-0 bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-e4)] p-4 w-[340px] max-w-[calc(100vw-32px)]"
          >
            {/* Header with Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goPrevYear}
                aria-label="ปีก่อนหน้า"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm font-medium"
              >
                {toBE(viewMonth.getFullYear() - 1)}
              </button>
              
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  aria-label="เดือนก่อนหน้า"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={18} className="text-gray-600" />
                </button>
                
                <div className="min-w-[140px] text-center">
                  <span className="font-semibold text-gray-900">
                    {THAI_MONTHS_LONG[viewMonth.getMonth()]}
                  </span>
                  <span className="ml-2 text-blue-600 font-bold">
                    {toBE(viewMonth.getFullYear())}
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={goNextMonth}
                  aria-label="เดือนถัดไป"
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={18} className="text-gray-600" />
                </button>
              </div>
              
              <button
                type="button"
                onClick={goNextYear}
                aria-label="ปีถัดไป"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors text-sm font-medium"
              >
                {toBE(viewMonth.getFullYear() + 1)}
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {THAI_WEEKDAYS_SHORT.map((d, i) => (
                <div 
                  key={d} 
                  className={cn(
                    "text-center text-xs font-medium py-2",
                    i >= 5 ? "text-red-400" : "text-gray-400"
                  )}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-1">{dayCells}</div>

            {/* Today Button */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  onChange(today.toISOString());
                  setViewMonthOverride(null);
                  setLocalError("");
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                วันนี้ ({formatDisplayDate(new Date().toISOString())})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error/Helper Messages */}
      {(error || localError) && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500" />
          {error || localError}
        </p>
      )}
      {helper && !(error || localError) && (
        <p className="mt-1.5 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
}
