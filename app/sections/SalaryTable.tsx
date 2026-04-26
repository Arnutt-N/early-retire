"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SalaryRecord } from "@/lib/calculations";
import type { FormState, SalaryOverride } from "@/types";
import { formatNumber, formatThaiDate } from "@/lib/utils";
import {
  Calculator,
  TrendingUp,
  AlertCircle,
  Trash2,
  ChevronLeft,
  Settings,
  Pencil,
  Check,
  ChevronDown,
  CalendarRange,
  Plus,
} from "lucide-react";
import Button from "@/components/ui/Button";
import CalendarPickerTH from "@/components/ui/CalendarPickerTH";
import { cn } from "@/lib/utils";
import { LEVEL_DISPLAY_ORDER } from "@/lib/levels";

interface Props {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
  records: SalaryRecord[];
  onNext: () => void;
  onBack: () => void;
}

export default function SalaryTableSection({
  form,
  updateForm,
  records,
  onNext,
  onBack,
}: Props) {
  // Track which row is in edit-mode (one at a time, both desktop + mobile).
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  // Mobile only: which compact row has its details expanded.
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const updateOverride = (idx: number, partial: Partial<SalaryOverride>) => {
    const overrides = [...form.salaryOverrides];
    while (overrides.length <= idx) {
      overrides.push({ effectiveDate: null, level: null, percent: null });
    }
    overrides[idx] = { ...overrides[idx], ...partial };
    updateForm({ salaryOverrides: overrides });
  };

  const clearOverride = (idx: number) => {
    const overrides = [...form.salaryOverrides];
    if (idx >= overrides.length) return;
    overrides[idx] = { effectiveDate: null, level: null, percent: null };
    updateForm({ salaryOverrides: overrides });
    if (editingIdx === idx) setEditingIdx(null);
  };

  const isGfp = form.mode === "gfp";

  // 60-month averaging window for GFP. Each row contributes its monthsInWindow
  // (6 = full fiscal round inside, 1-5 = partial boundary, 0 = outside).
  // The displayed table may extend further back so users can edit older history,
  // but only rows with monthsInWindow > 0 feed the avg-60 formula.
  const rowsInWindow = records.filter((r) => r.monthsInWindow > 0);
  const totalMonthsInWindow = records.reduce(
    (s, r) => s + r.monthsInWindow,
    0,
  );
  // Calendar-precise window boundaries (NOT the row.period, which snaps to
  // fiscal-round starts). The summary card needs to show:
  //   เริ่มนับ = exit − 60 calendar months (e.g. resign 1/6/2570 → 1/6/2565)
  //   วันก่อนพ้น = exit − 1 day (e.g. exit 1/10/2585 → 30/9/2585)
  const exitDate = form.endDate ? new Date(form.endDate) : null;
  const windowStartCalendar =
    exitDate && !isNaN(exitDate.getTime())
      ? (() => {
          const d = new Date(exitDate);
          d.setMonth(d.getMonth() - 60);
          return d.toISOString();
        })()
      : null;
  const windowEndCalendar =
    exitDate && !isNaN(exitDate.getTime())
      ? (() => {
          const d = new Date(exitDate);
          d.setDate(d.getDate() - 1);
          return d.toISOString();
        })()
      : null;
  const monthsShortBy = Math.max(0, 60 - totalMonthsInWindow);
  const windowComplete = totalMonthsInWindow >= 60;
  const totalRowMonths = records.length * 6;

  const subtitle = isGfp
    ? `รวม ${totalMonthsInWindow} / 60 เดือน ใน ${rowsInWindow.length} แถวที่นับ — สูตร กบข. ใช้ค่าเฉลี่ย 60 เดือนสุดท้ายก่อนพ้นราชการ`
    : `วันเลื่อนเงินเดือนล่าสุด → วันก่อนพ้นราชการ (${records.length} รอบ × 6 เดือน = ${totalRowMonths} เดือน)`;

  // "Add a row backward" — push latestAssessmentDate back one fiscal round
  // (6 months) so generateSalaryTable adds one more historical row. Used when
  // total months < 60 (e.g. short career or window edge case) or the user
  // wants to manually inspect/edit an extra historical assessment.
  const addRowBackward = () => {
    const firstPeriod = records[0]?.period ?? null;
    const anchor = firstPeriod
      ? new Date(firstPeriod)
      : form.latestAssessmentDate
        ? new Date(form.latestAssessmentDate)
        : new Date();
    if (isNaN(anchor.getTime())) return;
    const next = new Date(anchor);
    next.setMonth(next.getMonth() - 6);
    updateForm({ latestAssessmentDate: next.toISOString() });
  };

  // Always show the "+ Add row backward" affordance in GFP mode (not gated on
   // window-complete) so the user can keep extending history even after the
   // 60-month window is full — useful for documenting earlier fiscal rounds
   // they remember and want to override per-row.
  const showExtendButton = isGfp && records.length > 0;

  // Per-row badge that tells the user whether this row is part of the 60-month
  // averaging window — and if partial, how many months it actually contributes.
  // Hidden for non-GFP (the formula uses last salary only, not an average).
  const renderMonthsBadge = (months: number) => {
    if (!isGfp) return null;
    if (months === 0) {
      return (
        <span
          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded"
          title="แถวนี้อยู่นอกช่วง 60 เดือนเฉลี่ย — ไม่ถูกนับเข้าค่าเฉลี่ย กบข."
        >
          ไม่นับ
        </span>
      );
    }
    const isPartial = months < 6;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded",
          isPartial
            ? "bg-amber-100 text-amber-700"
            : "bg-emerald-100 text-emerald-700",
        )}
        title={
          isPartial
            ? `แถวคาบเกี่ยวขอบช่วง 60 เดือน — นับเข้าค่าเฉลี่ยเพียง ${months} เดือน`
            : "นับเต็ม 6 เดือนในช่วง 60 เดือนเฉลี่ย"
        }
      >
        {months} เดือน
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
          <Calculator size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-medium bg-violet-50 text-violet-600 rounded-full">
              ขั้นตอนที่ 5
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">การคำนวณ</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>

      {/* Default Level Picker */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings size={18} className="text-violet-600" />
          <label className="text-sm font-semibold text-violet-900">
            ระดับตำแหน่งของคุณ
          </label>
        </div>
        <p className="text-xs text-violet-600 mb-3">
          ใช้เป็นค่าเริ่มต้นของทุกแถว — สามารถแก้ไขรายแถวด้านล่างได้หากตำแหน่งเปลี่ยน
        </p>
        <select
          value={form.defaultLevel}
          onChange={(e) => updateForm({ defaultLevel: e.target.value })}
          className="w-full px-4 py-3 min-h-[48px] rounded-xl border-2 border-violet-200 bg-white focus:outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-200 font-medium text-gray-900 cursor-pointer"
        >
          {LEVEL_DISPLAY_ORDER.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* 60-month calculation window — GFP only. Shows the exact months feeding
          the บำนาญ averaging formula. Each row in the table below carries a
          "X เดือน" badge so users can visually verify the total = 60. */}
      {isGfp && records.length > 0 && (
        <div
          className={cn(
            "rounded-2xl p-5 border bg-gradient-to-r",
            windowComplete
              ? "from-emerald-50 to-green-50 border-emerald-200"
              : "from-amber-50 to-orange-50 border-amber-200",
          )}
        >
          <div className="flex items-start gap-3 mb-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                windowComplete ? "bg-emerald-100" : "bg-amber-100",
              )}
            >
              <CalendarRange
                size={20}
                className={windowComplete ? "text-emerald-700" : "text-amber-700"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3
                  className={cn(
                    "text-sm font-semibold",
                    windowComplete ? "text-emerald-900" : "text-amber-900",
                  )}
                >
                  ช่วงคำนวณบำนาญ — รวม {totalMonthsInWindow} / 60 เดือน
                </h3>
                {windowComplete ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-600 text-white">
                    <Check size={10} />
                    ครบ
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-600 text-white">
                    <AlertCircle size={10} />
                    ขาด {monthsShortBy} เดือน
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "text-xs leading-relaxed",
                  windowComplete ? "text-emerald-700" : "text-amber-700",
                )}
              >
                สูตร กบข. ใช้ค่าเฉลี่ยเงินเดือน 60 เดือนสุดท้ายก่อนพ้นราชการ —
                แถวที่ติดป้าย <span className="font-semibold">&quot;X เดือน&quot;</span>{" "}
                คือแถวที่นับเข้าค่าเฉลี่ย
              </p>
            </div>
          </div>
          {windowStartCalendar && windowEndCalendar && (
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div
                className={cn(
                  "bg-white/70 rounded-lg px-3 py-2 border",
                  windowComplete ? "border-emerald-100" : "border-amber-100",
                )}
              >
                <p
                  className={cn(
                    "text-[10px] uppercase tracking-wide font-medium mb-0.5",
                    windowComplete ? "text-emerald-600" : "text-amber-600",
                  )}
                >
                  เริ่มนับ
                </p>
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    windowComplete ? "text-emerald-900" : "text-amber-900",
                  )}
                >
                  {formatThaiDate(windowStartCalendar)}
                </p>
              </div>
              <div
                className={cn(
                  "bg-white/70 rounded-lg px-3 py-2 border",
                  windowComplete ? "border-emerald-100" : "border-amber-100",
                )}
              >
                <p
                  className={cn(
                    "text-[10px] uppercase tracking-wide font-medium mb-0.5",
                    windowComplete ? "text-emerald-600" : "text-amber-600",
                  )}
                >
                  วันก่อนพ้นราชการ
                </p>
                <p
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    windowComplete ? "text-emerald-900" : "text-amber-900",
                  )}
                >
                  {formatThaiDate(windowEndCalendar)}
                </p>
              </div>
            </div>
          )}

          {showExtendButton && (
            <div
              className={cn(
                "mt-4 pt-4 border-t",
                windowComplete ? "border-emerald-200" : "border-amber-200",
              )}
            >
              <p
                className={cn(
                  "text-xs mb-2",
                  windowComplete ? "text-emerald-700" : "text-amber-700",
                )}
              >
                {windowComplete ? (
                  <>
                    ครบ 60 เดือนแล้ว — หากต้องการเพิ่มแถวประวัติเงินเดือนย้อนหลังเพิ่มเติม
                    (เพื่อบันทึก % ของรอบเก่าๆ) คลิกปุ่มด้านล่าง
                  </>
                ) : (
                  <>
                    ขาดอีก <span className="font-semibold">{monthsShortBy} เดือน</span>{" "}
                    — กดปุ่มเพื่อเพิ่มแถวประวัติเงินเดือนย้อนหลัง 1 รอบ (6 เดือน)
                    แล้วแก้ไข % ของแถวใหม่ได้ที่ตารางด้านล่าง
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={addRowBackward}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2",
                  windowComplete
                    ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-300"
                    : "bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-300",
                )}
              >
                <Plus size={14} />
                เพิ่มแถวประวัติย้อนหลัง 6 เดือน
              </button>
            </div>
          )}
        </div>
      )}

      {/* Records */}
      {records.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Calculator size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">กรุณากรอกข้อมูลขั้นตอนก่อนหน้าให้ครบ</p>
          <p className="text-sm text-gray-400 mt-1">เพื่อดูตารางคำนวณเงินเดือน</p>
        </div>
      ) : (
        <>
          {/* === Desktop: full table === */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-e1)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                    <th className="px-3 py-3 text-left font-semibold text-violet-900 whitespace-nowrap">
                      วันที่มีผล
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-violet-900 whitespace-nowrap">
                      ระดับตำแหน่ง
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">
                      เงินเดือนเดิม
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">
                      ขั้นสูง
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">
                      ฐาน
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">
                      % เลื่อน
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">
                      เลื่อนจริง
                    </th>
                    <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">
                      เงินเดือนใหม่
                    </th>
                    <th className="px-3 py-3 text-center font-semibold text-violet-900 whitespace-nowrap w-24">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const override = form.salaryOverrides[i];
                    const hasOverride =
                      !!override?.level ||
                      !!override?.effectiveDate ||
                      override?.percent !== null;
                    const isEditing = editingIdx === i;
                    const displayDate = override?.effectiveDate ?? r.period;
                    const displayLevel = override?.level ?? r.level;
                    const displayPercent = override?.percent ?? r.percent;

                    return (
                      <tr
                        key={i}
                        className={cn(
                          "border-b border-gray-100 last:border-b-0 transition-colors",
                          r.isCurrent && "bg-amber-50/40",
                          r.isEstimated && !r.isCurrent && "bg-gray-50/30",
                          isEditing && "bg-violet-50/40",
                        )}
                      >
                        {/* วันที่มีผล */}
                        <td className="px-3 py-2.5 align-middle min-w-[180px]">
                          {isEditing ? (
                            <CalendarPickerTH
                              value={displayDate}
                              onChange={(d) => updateOverride(i, { effectiveDate: d })}
                            />
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-gray-800 tabular-nums">
                                {formatThaiDate(displayDate)}
                              </span>
                              {r.isCurrent && (
                                <span
                                  className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded"
                                  title="รอบปัจจุบัน"
                                >
                                  ปัจจุบัน
                                </span>
                              )}
                              {r.isEstimated && !r.isCurrent && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded"
                                  title="รอบในอนาคต — ใช้ค่าเฉลี่ย %"
                                >
                                  <AlertCircle size={10} />
                                  ประมาณ
                                </span>
                              )}
                              {renderMonthsBadge(r.monthsInWindow)}
                            </div>
                          )}
                        </td>

                        {/* ระดับตำแหน่ง */}
                        <td className="px-3 py-2.5 align-middle min-w-[160px]">
                          {isEditing ? (
                            <select
                              value={displayLevel}
                              onChange={(e) =>
                                updateOverride(i, { level: e.target.value })
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                            >
                              {LEVEL_DISPLAY_ORDER.map((l) => (
                                <option key={l.value} value={l.value}>
                                  {l.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-gray-700">
                              {LEVEL_DISPLAY_ORDER.find((l) => l.value === displayLevel)
                                ?.label ?? displayLevel}
                            </span>
                          )}
                        </td>

                        {/* เงินเดือนเดิม */}
                        <td className="px-3 py-2.5 align-middle text-right tabular-nums">
                          {formatNumber(r.oldSalary)}
                        </td>

                        {/* ขั้นสูง */}
                        <td className="px-3 py-2.5 align-middle text-right tabular-nums text-gray-500">
                          {formatNumber(r.maxSalary)}
                        </td>

                        {/* ฐาน */}
                        <td className="px-3 py-2.5 align-middle text-right tabular-nums text-gray-500">
                          {formatNumber(r.base)}
                        </td>

                        {/* % เลื่อน */}
                        <td className="px-3 py-2.5 align-middle text-right tabular-nums min-w-[80px]">
                          {isEditing ? (
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*[.]?[0-9]*"
                              value={displayPercent}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const cleaned = raw
                                  .replace(/[^\d.]/g, "")
                                  .replace(/(\..*?)\..*/, "$1");
                                const v = parseFloat(cleaned);
                                updateOverride(i, {
                                  percent: isNaN(v) ? null : v,
                                });
                              }}
                              className={cn(
                                "w-full px-2 py-1.5 rounded-lg border bg-white text-right text-xs font-medium focus:outline-none",
                                Number(displayPercent) > 6
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-200 focus:border-violet-500",
                              )}
                              title={
                                Number(displayPercent) > 6
                                  ? "เกิน 6% — โปรดตรวจสอบ"
                                  : undefined
                              }
                            />
                          ) : (
                            <span
                              className={cn(
                                "font-medium",
                                Number(displayPercent) > 6
                                  ? "text-red-600"
                                  : "text-gray-800",
                              )}
                              title={
                                Number(displayPercent) > 6
                                  ? "เกิน 6% — โปรดตรวจสอบ"
                                  : undefined
                              }
                            >
                              {Number(displayPercent).toFixed(2)}%
                            </span>
                          )}
                        </td>

                        {/* เลื่อนจริง */}
                        <td className="px-3 py-2.5 align-middle text-right tabular-nums text-emerald-600 font-semibold">
                          +{formatNumber(r.actualIncrease)}
                        </td>

                        {/* เงินเดือนใหม่ */}
                        <td className="px-3 py-2.5 align-middle text-right tabular-nums font-bold text-violet-700">
                          {formatNumber(r.newSalary)}
                        </td>

                        {/* จัดการ */}
                        <td className="px-3 py-2.5 align-middle text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => setEditingIdx(null)}
                                aria-label={`บันทึกการแก้ไขแถว ${i + 1}`}
                                className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="เสร็จสิ้น"
                              >
                                <Check size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingIdx(i)}
                                aria-label={`แก้ไขแถว ${i + 1}`}
                                className="p-1.5 rounded-md text-violet-600 hover:bg-violet-50 transition-colors cursor-pointer"
                                title="แก้ไขแถวนี้"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => clearOverride(i)}
                              disabled={!hasOverride}
                              aria-label={`ล้างการแก้ไขแถว ${i + 1}`}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title={
                                hasOverride
                                  ? "ลบการแก้ไขแถวนี้ (กลับเป็นค่าเริ่มต้น)"
                                  : "ยังไม่มีการแก้ไขที่จะลบ"
                              }
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* === Mobile: compact card list === */}
          <div className="md:hidden space-y-2">
            {records.map((r, i) => {
              const override = form.salaryOverrides[i];
              const hasOverride =
                !!override?.level ||
                !!override?.effectiveDate ||
                override?.percent !== null;
              const isEditing = editingIdx === i;
              const isExpanded = expandedIdx === i || isEditing;
              const displayDate = override?.effectiveDate ?? r.period;
              const displayLevel = override?.level ?? r.level;
              const displayPercent = override?.percent ?? r.percent;

              return (
                <div
                  key={i}
                  className={cn(
                    "bg-white rounded-xl border shadow-[var(--shadow-e1)] overflow-hidden transition-colors",
                    isEditing
                      ? "border-violet-300 bg-violet-50/30"
                      : r.isCurrent
                        ? "border-amber-200 bg-amber-50/30"
                        : "border-gray-100",
                  )}
                >
                  {/* Compact summary row */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditing) return;
                      setExpandedIdx(isExpanded ? null : i);
                    }}
                    className="w-full grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-2.5 text-left cursor-pointer hover:bg-gray-50/50"
                    aria-expanded={isExpanded}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-800 tabular-nums">
                          {formatThaiDate(displayDate)}
                        </span>
                        {r.isCurrent && (
                          <span className="px-1 py-0.5 text-[9px] font-medium bg-amber-100 text-amber-700 rounded">
                            ปัจจุบัน
                          </span>
                        )}
                        {r.isEstimated && !r.isCurrent && (
                          <span className="px-1 py-0.5 text-[9px] font-medium bg-gray-100 text-gray-500 rounded">
                            ประมาณ
                          </span>
                        )}
                        {renderMonthsBadge(r.monthsInWindow)}
                      </div>
                    </div>
                    <span className="text-[11px] tabular-nums text-gray-600 font-medium">
                      {Number(displayPercent).toFixed(2)}%
                    </span>
                    <span className="text-xs tabular-nums font-bold text-violet-700">
                      {formatNumber(r.newSalary)}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        "text-gray-400 transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-gray-100"
                      >
                        <div className="px-3 py-3 space-y-2">
                          {/* Editable rows when editing */}
                          {isEditing ? (
                            <div className="space-y-2.5">
                              <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                  วันที่มีผล
                                </label>
                                <CalendarPickerTH
                                  value={displayDate}
                                  onChange={(d) =>
                                    updateOverride(i, { effectiveDate: d })
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                  ระดับตำแหน่ง
                                </label>
                                <select
                                  value={displayLevel}
                                  onChange={(e) =>
                                    updateOverride(i, { level: e.target.value })
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                                >
                                  {LEVEL_DISPLAY_ORDER.map((l) => (
                                    <option key={l.value} value={l.value}>
                                      {l.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-gray-500 mb-1">
                                  % เลื่อน
                                  <span className="ml-1 text-gray-400">(สูงสุด 6%)</span>
                                </label>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  pattern="[0-9]*[.]?[0-9]*"
                                  value={displayPercent}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    const cleaned = raw
                                      .replace(/[^\d.]/g, "")
                                      .replace(/(\..*?)\..*/, "$1");
                                    const v = parseFloat(cleaned);
                                    updateOverride(i, {
                                      percent: isNaN(v) ? null : v,
                                    });
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2 rounded-lg border bg-white text-right text-xs font-medium focus:outline-none",
                                    Number(displayPercent) > 6
                                      ? "border-red-300 focus:border-red-500"
                                      : "border-gray-200 focus:border-violet-500",
                                  )}
                                />
                                {Number(displayPercent) > 6 && (
                                  <p className="mt-1 text-[10px] text-red-500">
                                    เกิน 6% — โปรดตรวจสอบ
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                              <dt className="text-gray-500">ระดับตำแหน่ง</dt>
                              <dd className="text-gray-800 text-right">
                                {LEVEL_DISPLAY_ORDER.find((l) => l.value === displayLevel)?.label ?? displayLevel}
                              </dd>
                              <dt className="text-gray-500">เงินเดือนเดิม</dt>
                              <dd className="text-right tabular-nums text-gray-700">
                                {formatNumber(r.oldSalary)}
                              </dd>
                              <dt className="text-gray-500">ขั้นสูง</dt>
                              <dd className="text-right tabular-nums text-gray-500">
                                {formatNumber(r.maxSalary)}
                              </dd>
                              <dt className="text-gray-500">ฐานคำนวณ</dt>
                              <dd className="text-right tabular-nums text-gray-500">
                                {formatNumber(r.base)}
                              </dd>
                              <dt className="text-gray-500">เลื่อนจริง</dt>
                              <dd className="text-right tabular-nums text-emerald-600 font-semibold">
                                +{formatNumber(r.actualIncrease)}
                              </dd>
                            </dl>
                          )}

                          {/* Action row */}
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                            {isEditing ? (
                              <button
                                type="button"
                                onClick={() => setEditingIdx(null)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <Check size={14} />
                                เสร็จสิ้น
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingIdx(i)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors cursor-pointer"
                              >
                                <Pencil size={12} />
                                แก้ไข
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => clearOverride(i)}
                              disabled={!hasOverride}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
                            >
                              <Trash2 size={12} />
                              ลบ
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Bottom "+ Add row" — duplicates the affordance from the summary
              card so users who scrolled past the top can still extend history
              without scrolling back up. GFP-only, always visible. */}
          {showExtendButton && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addRowBackward}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2",
                  windowComplete
                    ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50 focus-visible:ring-emerald-300"
                    : "border-amber-300 text-amber-700 hover:bg-amber-50 focus-visible:ring-amber-300",
                )}
              >
                <Plus size={16} />
                เพิ่มแถวประวัติย้อนหลัง 6 เดือน
                {!windowComplete && (
                  <span className="text-[11px] font-normal opacity-75">
                    (ขาดอีก {monthsShortBy} เดือน)
                  </span>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          icon={<ChevronLeft size={18} />}
          iconPosition="left"
        >
          กลับ
        </Button>
        <Button onClick={onNext} size="lg" icon={<TrendingUp size={18} />}>
          ดูผลลัพธ์
        </Button>
      </div>
    </motion.div>
  );
}
