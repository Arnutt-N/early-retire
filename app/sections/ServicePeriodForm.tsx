"use client";

import { motion } from "framer-motion";
import { calculateServicePeriod } from "@/lib/calculations";
import type { FormState } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CalendarPickerTH from "@/components/ui/CalendarPickerTH";
import { Clock, Plus, Trash2 } from "lucide-react";

interface Props {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ServicePeriodForm({ form, updateForm, onNext, onBack }: Props) {
  const start = form.startDate ? new Date(form.startDate) : null;
  const end = form.endDate ? new Date(form.endDate) : null;
  const leaveDays =
    (form.sickLeaveDays || 0) +
    (form.personalLeaveDays || 0) +
    (form.vacationDays || 0);
  const basePeriod = start && end ? calculateServicePeriod(start, end, leaveDays) : null;

  // Visibility: hide default multiplier periods if user's startDate is AFTER the period's start.
  // Per requirement #5/#6: if startDate is before/within an auto-multiplier window, show it
  // (with leave deduction); if startDate is after all auto windows, only user-added rows show.
  const visiblePeriods = form.multiplierPeriods.filter((p) => {
    const isDefault = p.id?.startsWith("default-");
    if (!isDefault) return true; // user-added — always show
    if (!form.startDate) return true; // no start yet — show all defaults
    const startD = new Date(form.startDate);
    const periodEnd = new Date(p.endDate);
    return startD <= periodEnd; // show if user started on or before the period ended
  });

  const addMultiplier = () => {
    const newPeriods = [
      ...form.multiplierPeriods,
      { id: crypto.randomUUID(), startDate: "", endDate: "", multiplier: 1, label: "" },
    ];
    updateForm({ multiplierPeriods: newPeriods });
  };

  const removeMultiplier = (period: typeof form.multiplierPeriods[number]) => {
    const newPeriods = form.multiplierPeriods.filter((p) => p !== period);
    updateForm({ multiplierPeriods: newPeriods });
  };

  const updateMultiplier = (
    period: typeof form.multiplierPeriods[number],
    field: "startDate" | "endDate" | "multiplier",
    value: string | number,
  ) => {
    const newPeriods = form.multiplierPeriods.map((p) =>
      p === period ? { ...p, [field]: value } : p,
    );
    updateForm({ multiplierPeriods: newPeriods });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center">
          <Clock size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold">เวลาราชการ</h2>
          <p className="text-sm text-gray-500">
            ตรวจสอบเวลาราชการ + เพิ่มช่วงทวีคูณและหักวันลา
          </p>
        </div>
      </div>

      {basePeriod && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">อายุราชการ (หลังหักวันลา)</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-700">{basePeriod.years}</p>
              <p className="text-sm text-blue-600">ปี</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{basePeriod.months}</p>
              <p className="text-sm text-blue-600">เดือน</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{basePeriod.days}</p>
              <p className="text-sm text-blue-600">วัน</p>
            </div>
          </div>
          <p className="text-xs text-blue-500 mt-2 text-center">
            รวม {basePeriod.totalYears.toFixed(2)} ปี ({basePeriod.totalDays} วัน
            {leaveDays > 0 && `, หักวันลา ${leaveDays} วัน`})
          </p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">เวลาราชการทวีคูณ</h3>
        {visiblePeriods.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            ไม่มีช่วงเวลาทวีคูณ — สามารถเพิ่มได้ด้านล่าง
          </p>
        ) : (
          visiblePeriods.map((period) => (
            <div
              key={period.id || period.startDate}
              className="bg-white border border-gray-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">
                  {period.label || `ช่วงที่กำหนดเอง`}
                </p>
                {!period.id?.startsWith("default-") && (
                  <button
                    type="button"
                    onClick={() => removeMultiplier(period)}
                    aria-label="ลบช่วงนี้"
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <CalendarPickerTH
                  label="วันเริ่มต้น"
                  value={period.startDate || null}
                  onChange={(d) => updateMultiplier(period, "startDate", d || "")}
                />
                <CalendarPickerTH
                  label="วันสิ้นสุด"
                  value={period.endDate || null}
                  onChange={(d) => updateMultiplier(period, "endDate", d || "")}
                />
                <Input
                  label="ตัวคูณ"
                  value={period.multiplier}
                  onChange={(v) => updateMultiplier(period, "multiplier", parseFloat(v) || 0)}
                  type="number"
                  step={0.1}
                  suffix="เท่า"
                />
              </div>
            </div>
          ))
        )}
        <Button variant="outline" size="sm" onClick={addMultiplier} icon={<Plus size={16} />}>
          เพิ่มช่วงทวีคูณ
        </Button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold">หักวันลา (จะลบจากอายุราชการรวม)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="ลาป่วย (วัน)"
            value={form.sickLeaveDays}
            onChange={(v) => updateForm({ sickLeaveDays: parseInt(v) || 0 })}
            type="number"
            min={0}
          />
          <Input
            label="ลากิจ (วัน)"
            value={form.personalLeaveDays}
            onChange={(v) => updateForm({ personalLeaveDays: parseInt(v) || 0 })}
            type="number"
            min={0}
          />
          <Input
            label="ลาพักผ่อน (วัน)"
            value={form.vacationDays}
            onChange={(v) => updateForm({ vacationDays: parseInt(v) || 0 })}
            type="number"
            min={0}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          กลับ
        </Button>
        <Button onClick={onNext} icon={<Clock size={18} />}>
          ถัดไป
        </Button>
      </div>
    </motion.div>
  );
}
