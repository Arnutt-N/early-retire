"use client";

import { motion } from "framer-motion";
import type { SalaryRecord, SalaryBaseInfo } from "@/lib/calculations";
import type { FormState, SalaryOverride } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Calculator, TrendingUp, AlertCircle, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import CalendarPickerTH from "@/components/ui/CalendarPickerTH";

interface Props {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
  records: SalaryRecord[];
  salaryBases: SalaryBaseInfo[];
  onNext: () => void;
  onBack: () => void;
}

export default function SalaryTableSection({
  form,
  updateForm,
  records,
  salaryBases,
  onNext,
  onBack,
}: Props) {
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
  };

  const subtitle =
    form.mode === "gfp"
      ? `60 เดือนสุดท้าย (${records.length} รอบประเมิน)`
      : `รอบประเมินล่าสุด → วันเกษียณ (${records.length} รอบประเมิน)`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center">
          <Calculator size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold">การคำนวณ</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>

      {/* Default level picker */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <label className="block text-sm font-medium text-blue-900 mb-1.5">
          ระดับตำแหน่งของคุณ
        </label>
        <p className="text-xs text-blue-600 mb-2">
          ใช้เป็น default ของทุกแถว — แก้รายแถวด้านล่างได้ถ้าตำแหน่งเปลี่ยน
        </p>
        <select
          value={form.defaultLevel}
          onChange={(e) => updateForm({ defaultLevel: e.target.value })}
          className="w-full px-4 py-3 min-h-[44px] rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
        >
          {salaryBases.map((b) => (
            <option key={b.level} value={b.level}>
              {b.level}
            </option>
          ))}
        </select>
      </div>

      {/* Records — card per row */}
      {records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calculator size={48} className="mx-auto mb-3 opacity-50" />
          <p>กรุณากรอกข้อมูลขั้นตอนก่อนหน้าให้ครบ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r, i) => {
            const override = form.salaryOverrides[i];
            const hasOverride =
              !!override?.level || !!override?.effectiveDate || override?.percent !== null;
            return (
              <div
                key={i}
                className={`bg-white border rounded-2xl p-4 space-y-3 shadow-[var(--shadow-e1)] ${
                  r.isCurrent
                    ? "border-amber-300 bg-amber-50/30"
                    : r.isEstimated
                      ? "border-gray-200 bg-gray-50/50"
                      : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      รอบที่ {i + 1}
                    </span>
                    {r.isCurrent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        ปัจจุบัน
                      </span>
                    )}
                    {r.isEstimated && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 inline-flex items-center gap-1">
                        <AlertCircle size={12} /> ประมาณการ
                      </span>
                    )}
                  </div>
                  {hasOverride && (
                    <button
                      type="button"
                      onClick={() => clearOverride(i)}
                      aria-label="ล้างการแก้ไขแถวนี้"
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CalendarPickerTH
                    label="วันที่มีผล"
                    value={override?.effectiveDate ?? r.period}
                    onChange={(d) => updateOverride(i, { effectiveDate: d })}
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      ระดับตำแหน่ง
                    </label>
                    <select
                      value={override?.level ?? r.level}
                      onChange={(e) => updateOverride(i, { level: e.target.value })}
                      className="w-full px-4 py-3 min-h-[44px] rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]"
                    >
                      {salaryBases.map((b) => (
                        <option key={b.level} value={b.level}>
                          {b.level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-gray-50/60 rounded-xl p-3">
                  <div>
                    <p className="text-xs text-gray-500">เงินเดือนเดิม</p>
                    <p className="font-medium">{formatNumber(r.oldSalary)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">เงินเดือนขั้นสูง</p>
                    <p className="font-medium">{formatNumber(r.maxSalary)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">ฐานคำนวณ</p>
                    <p className="font-medium">{formatNumber(r.base)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">
                      % เลื่อน
                      {r.isEstimated && (
                        <span className="text-amber-600 ml-1">(ใช้ค่าเฉลี่ย)</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={override?.percent ?? r.percent}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        updateOverride(i, { percent: isNaN(v) ? null : v });
                      }}
                      className="w-full px-2 py-1 rounded-lg border border-gray-200 bg-white text-right text-sm focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm pt-1">
                  <div>
                    <p className="text-xs text-gray-500">เงินที่เลื่อนจริง</p>
                    <p className="font-medium">{formatNumber(r.actualIncrease)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">เงินเดือนใหม่</p>
                    <p className="text-lg font-bold text-[var(--color-primary)]">
                      {formatNumber(r.newSalary)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          กลับ
        </Button>
        <Button onClick={onNext} icon={<TrendingUp size={18} />}>
          ดูผลลัพธ์
        </Button>
      </div>
    </motion.div>
  );
}
