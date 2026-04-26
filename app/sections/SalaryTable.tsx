"use client";

import { motion } from "framer-motion";
import type { SalaryRecord, SalaryBaseInfo } from "@/lib/calculations";
import type { FormState, SalaryOverride } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Calculator, TrendingUp, AlertCircle, Trash2, ChevronLeft, Settings } from "lucide-react";
import Button from "@/components/ui/Button";
import CalendarPickerTH from "@/components/ui/CalendarPickerTH";
import { cn } from "@/lib/utils";

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
      className="space-y-8"
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
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={18} className="text-violet-600" />
          <label className="text-sm font-semibold text-violet-900">
            ระดับตำแหน่งของคุณ
          </label>
        </div>
        <p className="text-xs text-violet-600 mb-3">
          ใช้เป็น default ของทุกแถว — สามารถแก้ไขรายแถวด้านล่างได้หากตำแหน่งเปลี่ยน
        </p>
        <select
          value={form.defaultLevel}
          onChange={(e) => updateForm({ defaultLevel: e.target.value })}
          className="w-full px-4 py-3 min-h-[48px] rounded-xl border-2 border-violet-200 bg-white focus:outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-200 font-medium text-gray-900"
        >
          {salaryBases.map((b) => (
            <option key={b.level} value={b.level}>
              {b.level}
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
        <div className="space-y-4">
          {records.map((r, i) => {
            const override = form.salaryOverrides[i];
            const hasOverride =
              !!override?.level || !!override?.effectiveDate || override?.percent !== null;
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "bg-white rounded-2xl border-2 overflow-hidden shadow-[var(--shadow-e1)] hover:shadow-[var(--shadow-e2)] transition-shadow",
                  r.isCurrent
                    ? "border-amber-300"
                    : r.isEstimated
                      ? "border-gray-100"
                      : "border-gray-100"
                )}
              >
                {/* Record Header */}
                <div className={cn(
                  "px-5 py-3 flex items-center justify-between",
                  r.isCurrent
                    ? "bg-gradient-to-r from-amber-50 to-orange-50"
                    : r.isEstimated
                      ? "bg-gradient-to-r from-gray-50 to-slate-50"
                      : "bg-gray-50"
                )}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-sm font-bold text-gray-600">
                      {i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">รอบที่ {i + 1}</span>
                      {r.isCurrent && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                          ปัจจุบัน
                        </span>
                      )}
                      {r.isEstimated && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full flex items-center gap-1">
                          <AlertCircle size={12} />
                          ประมาณการ
                        </span>
                      )}
                    </div>
                  </div>
                  {hasOverride && (
                    <button
                      type="button"
                      onClick={() => clearOverride(i)}
                      aria-label="ล้างการแก้ไขแถวนี้"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Record Body */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CalendarPickerTH
                      label="วันที่มีผล"
                      value={override?.effectiveDate ?? r.period}
                      onChange={(d) => updateOverride(i, { effectiveDate: d })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ระดับตำแหน่ง
                      </label>
                      <select
                        value={override?.level ?? r.level}
                        onChange={(e) => updateOverride(i, { level: e.target.value })}
                        className="w-full px-4 py-3 min-h-[48px] rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-200 font-medium"
                      >
                        {salaryBases.map((b) => (
                          <option key={b.level} value={b.level}>
                            {b.level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Salary Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">เงินเดือนเดิม</p>
                      <p className="font-semibold text-gray-900">{formatNumber(r.oldSalary)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">เงินเดือนขั้นสูง</p>
                      <p className="font-semibold text-gray-900">{formatNumber(r.maxSalary)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">ฐานคำนวณ</p>
                      <p className="font-semibold text-gray-900">{formatNumber(r.base)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">
                        % เลื่อน
                        {r.isEstimated && (
                          <span className="text-amber-600 ml-1">(ค่าเฉลี่ย)</span>
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
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white text-right font-medium focus:outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>

                  {/* Result Row */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-gray-500">เงินที่เลื่อนจริง</p>
                      <p className="font-semibold text-emerald-600">+{formatNumber(r.actualIncrease)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">เงินเดือนใหม่</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                        {formatNumber(r.newSalary)}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} icon={<ChevronLeft size={18} />} iconPosition="left">
          กลับ
        </Button>
        <Button onClick={onNext} size="lg" icon={<TrendingUp size={18} />}>
          ดูผลลัพธ์
        </Button>
      </div>
    </motion.div>
  );
}
