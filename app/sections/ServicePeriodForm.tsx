"use client";

import { motion } from "framer-motion";
import { calculateServicePeriod } from "@/lib/calculations";
import { FormState } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
  const basePeriod = start && end ? calculateServicePeriod(start, end) : null;

  const addMultiplier = () => {
    const newPeriods = [
      ...form.multiplierPeriods,
      { id: crypto.randomUUID(), startDate: "", endDate: "", multiplier: 1, label: "" },
    ];
    updateForm({ multiplierPeriods: newPeriods });
  };

  const removeMultiplier = (index: number) => {
    const newPeriods = form.multiplierPeriods.filter((_, i) => i !== index);
    updateForm({ multiplierPeriods: newPeriods });
  };

  const updateMultiplier = (index: number, field: string, value: string | number) => {
    const newPeriods = [...form.multiplierPeriods];
    newPeriods[index] = { ...newPeriods[index], [field]: value };
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
        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
          <Clock size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">เวลาราชการ</h2>
          <p className="text-sm text-[var(--text-muted)]">ตรวจสอบและเพิ่มช่วงเวลาราชการทวีคูณ</p>
        </div>
      </div>

      {basePeriod && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">อายุราชการพื้นฐาน</h3>
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
            รวม {basePeriod.totalYears.toFixed(2)} ปี ({basePeriod.totalDays} วัน)
          </p>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold text-[var(--text)]">เวลาราชการทวีคูณ</h3>
        {form.multiplierPeriods.map((period, index) => (
          <div key={period.id || index} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">ช่วงที่ {index + 1}</p>
              <button
                onClick={() => removeMultiplier(index)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="วันเริ่มต้น"
                value={period.startDate}
                onChange={(v) => updateMultiplier(index, "startDate", v)}
                type="date"
              />
              <Input
                label="วันสิ้นสุด"
                value={period.endDate}
                onChange={(v) => updateMultiplier(index, "endDate", v)}
                type="date"
              />
              <Input
                label="ตัวคูณ"
                value={period.multiplier}
                onChange={(v) => updateMultiplier(index, "multiplier", parseFloat(v) || 0)}
                type="number"
                step={0.1}
                suffix="เท่า"
              />
            </div>
            {period.label && <p className="text-xs text-gray-500">{period.label}</p>}
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addMultiplier} icon={<Plus size={16} />}>
          เพิ่มช่วงทวีคูณ
        </Button>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-[var(--text)]">หักวันลา</h3>
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
