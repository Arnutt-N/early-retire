"use client";

import { useState, useMemo, useCallback } from "react";
import { Calendar } from "lucide-react";
import { parseThaiDate, toBE } from "@/lib/utils";

interface DatePickerTHProps {
  label?: string;
  value: string | null; // ISO date string
  onChange: (isoDate: string | null) => void;
  error?: string;
  helper?: string;
  required?: boolean;
}

export default function DatePickerTH({
  label,
  value,
  onChange,
  error,
  helper,
  required,
}: DatePickerTHProps) {
  const [localError, setLocalError] = useState("");

  const dateParts = useMemo(() => {
    if (!value) return { day: "", month: "", beYear: "" };
    const d = new Date(value);
    if (isNaN(d.getTime())) return { day: "", month: "", beYear: "" };
    return {
      day: d.getDate().toString().padStart(2, "0"),
      month: (d.getMonth() + 1).toString().padStart(2, "0"),
      beYear: toBE(d.getFullYear()).toString(),
    };
  }, [value]);

  const validateAndUpdate = useCallback(
    (day: string, month: string, beYear: string) => {
      setLocalError("");
      if (!day && !month && !beYear) {
        onChange(null);
        return;
      }
      if (!day || !month || !beYear) {
        return;
      }
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
        onChange(date.toISOString());
      } catch {
        setLocalError("วันที่ไม่ถูกต้อง");
      }
    },
    [onChange]
  );

  const handleDayChange = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 2);
    validateAndUpdate(clean, dateParts.month, dateParts.beYear);
  };

  const handleMonthChange = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 2);
    validateAndUpdate(dateParts.day, clean, dateParts.beYear);
  };

  const handleYearChange = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4);
    validateAndUpdate(dateParts.day, dateParts.month, clean);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
          {label}
          {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="วว"
            value={dateParts.day}
            onChange={(e) => handleDayChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-center focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
          />
        </div>
        <span className="text-gray-400">/</span>
        <div className="relative flex-1">
          <input
            type="text"
            inputMode="numeric"
            placeholder="ดด"
            value={dateParts.month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-center focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
          />
        </div>
        <span className="text-gray-400">/</span>
        <div className="relative flex-[2]">
          <input
            type="text"
            inputMode="numeric"
            placeholder="ปปปป (พ.ศ.)"
            value={dateParts.beYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-center focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
          />
          <Calendar
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </div>
      {(error || localError) && (
        <p className="mt-1 text-sm text-[var(--danger)]">{error || localError}</p>
      )}
      {helper && !(error || localError) && (
        <p className="mt-1 text-sm text-[var(--text-muted)]">{helper}</p>
      )}
    </div>
  );
}
