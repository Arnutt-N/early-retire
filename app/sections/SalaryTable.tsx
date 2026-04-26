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

  const totalMonths = records.length * 6;
  const subtitle =
    form.mode === "gfp"
      ? `60 เดือนสุดท้ายก่อนพ้นราชการ (${records.length} รอบ × 6 เดือน = ${totalMonths} เดือน)`
      : `วันเลื่อนเงินเดือนล่าสุด → วันก่อนพ้นราชการ (${records.length} รอบ × 6 เดือน = ${totalMonths} เดือน)`;

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
                                  .replace(/(\..*)\./g, "$1");
                                const v = parseFloat(cleaned);
                                updateOverride(i, {
                                  percent: isNaN(v) ? null : v,
                                });
                              }}
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-right text-xs font-medium focus:outline-none focus:border-violet-500"
                            />
                          ) : (
                            <span className="font-medium text-gray-800">
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
                                      .replace(/(\..*)\./g, "$1");
                                    const v = parseFloat(cleaned);
                                    updateOverride(i, {
                                      percent: isNaN(v) ? null : v,
                                    });
                                  }}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-right text-xs font-medium focus:outline-none focus:border-violet-500"
                                />
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
