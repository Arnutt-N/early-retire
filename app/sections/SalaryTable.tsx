"use client";

import { motion } from "framer-motion";
import type { SalaryRecord } from "@/lib/calculations";
import type { FormState, SalaryOverride } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Calculator, TrendingUp, AlertCircle, Trash2, ChevronLeft, Settings } from "lucide-react";
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

      {/* Records — Single Table */}
      {records.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <Calculator size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">กรุณากรอกข้อมูลขั้นตอนก่อนหน้าให้ครบ</p>
          <p className="text-sm text-gray-400 mt-1">เพื่อดูตารางคำนวณเงินเดือน</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-e1)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                  <th className="px-3 py-3 text-left font-semibold text-violet-900 whitespace-nowrap">รอบ</th>
                  <th className="px-3 py-3 text-left font-semibold text-violet-900 whitespace-nowrap">วันที่มีผล</th>
                  <th className="px-3 py-3 text-left font-semibold text-violet-900 whitespace-nowrap">ระดับตำแหน่ง</th>
                  <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">เงินเดือนเดิม</th>
                  <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">ขั้นสูง</th>
                  <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">ฐาน</th>
                  <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">% เลื่อน</th>
                  <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">เลื่อนจริง</th>
                  <th className="px-3 py-3 text-right font-semibold text-violet-900 whitespace-nowrap">เงินเดือนใหม่</th>
                  <th className="px-2 py-3 text-center font-semibold text-violet-900 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const override = form.salaryOverrides[i];
                  const hasOverride =
                    !!override?.level ||
                    !!override?.effectiveDate ||
                    override?.percent !== null;
                  return (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-gray-100 last:border-b-0 transition-colors",
                        r.isCurrent && "bg-amber-50/40",
                        r.isEstimated && !r.isCurrent && "bg-gray-50/30",
                      )}
                    >
                      <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-700">{i + 1}</span>
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
                      </td>
                      <td className="px-2 py-2.5 align-middle min-w-[200px]">
                        <CalendarPickerTH
                          value={override?.effectiveDate ?? r.period}
                          onChange={(d) => updateOverride(i, { effectiveDate: d })}
                        />
                      </td>
                      <td className="px-2 py-2.5 align-middle min-w-[180px]">
                        <select
                          value={override?.level ?? r.level}
                          onChange={(e) => updateOverride(i, { level: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                        >
                          {LEVEL_DISPLAY_ORDER.map((l) => (
                            <option key={l.value} value={l.value}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right tabular-nums">
                        {formatNumber(r.oldSalary)}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right tabular-nums text-gray-500">
                        {formatNumber(r.maxSalary)}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right tabular-nums text-gray-500">
                        {formatNumber(r.base)}
                      </td>
                      <td className="px-2 py-2.5 align-middle min-w-[80px]">
                        <input
                          type="number"
                          step="0.1"
                          value={override?.percent ?? r.percent}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            updateOverride(i, { percent: isNaN(v) ? null : v });
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-right text-xs font-medium focus:outline-none focus:border-violet-500"
                        />
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right tabular-nums text-emerald-600 font-semibold">
                        +{formatNumber(r.actualIncrease)}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right tabular-nums font-bold text-violet-700">
                        {formatNumber(r.newSalary)}
                      </td>
                      <td className="px-2 py-2.5 align-middle text-center">
                        {hasOverride && (
                          <button
                            type="button"
                            onClick={() => clearOverride(i)}
                            aria-label={`ล้างการแก้ไขแถวที่ ${i + 1}`}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="ล้างการแก้ไขแถวนี้"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
