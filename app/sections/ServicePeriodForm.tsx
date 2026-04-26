"use client";

import { motion } from "framer-motion";
import { calculateServicePeriod } from "@/lib/calculations";
import type { FormState } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CalendarPickerTH from "@/components/ui/CalendarPickerTH";
import { Clock, Plus, Trash2, ChevronLeft, ChevronRight, Timer, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const visiblePeriods = form.multiplierPeriods.filter((p) => {
    const isDefault = p.id?.startsWith("default-");
    if (!isDefault) return true;
    if (!form.startDate) return true;
    const startD = new Date(form.startDate);
    const periodEnd = new Date(p.endDate);
    return startD <= periodEnd;
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
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
          <Clock size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-full">
              ขั้นตอนที่ 3
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">เวลาราชการ</h2>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบเวลาราชการ เพิ่มช่วงทวีคูณและหักวันลา</p>
        </div>
      </div>

      {/* Service Period Summary */}
      {basePeriod && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <Timer size={20} />
            <h3 className="font-semibold">อายุราชการ (หลังหักวันลา)</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">{basePeriod.years}</p>
              <p className="text-sm text-blue-100 mt-1">ปี</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">{basePeriod.months}</p>
              <p className="text-sm text-blue-100 mt-1">เดือน</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">{basePeriod.days}</p>
              <p className="text-sm text-blue-100 mt-1">วัน</p>
            </div>
          </div>
          <p className="text-xs text-blue-100 mt-4 text-center">
            รวม <span className="font-semibold text-white">{basePeriod.totalYears.toFixed(2)} ปี</span> 
            ({basePeriod.totalDays.toLocaleString()} วัน
            {leaveDays > 0 && `, หักวันลา ${leaveDays} วัน`})
          </p>
        </motion.div>
      )}

      {/* Multiplier Periods */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-e2)] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">เวลาราชการทวีคูณ</h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addMultiplier} 
            icon={<Plus size={16} />}
            iconPosition="left"
          >
            เพิ่มช่วง
          </Button>
        </div>

        {visiblePeriods.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <CalendarDays size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">ไม่มีช่วงเวลาทวีคูณ</p>
            <p className="text-xs text-gray-400 mt-1">คลิก &quot;เพิ่มช่วง&quot; เพื่อเพิ่มเวลาทวีคูณ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visiblePeriods.map((period, index) => {
              const isDefault = period.id?.startsWith("default-");
              return (
                <motion.div
                  key={period.id || period.startDate}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "rounded-xl border-2 p-5 space-y-4 transition-colors",
                    isDefault
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-gray-100 bg-gray-50/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {period.label || `ช่วงที่ ${index + 1}`}
                      </span>
                      {isDefault && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                          อัตโนมัติ
                        </span>
                      )}
                    </div>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => removeMultiplier(period)}
                        aria-label="ลบช่วงนี้"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leave Days — only when there's at least one multiplier period */}
      {visiblePeriods.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-e2)] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">หักวันลา</h3>
            <span className="text-xs text-gray-500">(จะลบจากอายุราชการรวม)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="ลาป่วย"
              value={form.sickLeaveDays}
              onChange={(v) => updateForm({ sickLeaveDays: parseInt(v) || 0 })}
              type="number"
              min={0}
              suffix="วัน"
            />
            <Input
              label="ลากิจ"
              value={form.personalLeaveDays}
              onChange={(v) => updateForm({ personalLeaveDays: parseInt(v) || 0 })}
              type="number"
              min={0}
              suffix="วัน"
            />
            <Input
              label="ลาพักผ่อน"
              value={form.vacationDays}
              onChange={(v) => updateForm({ vacationDays: parseInt(v) || 0 })}
              type="number"
              min={0}
              suffix="วัน"
            />
          </div>
          {leaveDays > 0 && (
            <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">รวมวันลาทั้งหมด:</span>
              <span className="text-lg font-bold text-gray-900">{leaveDays}</span>
              <span className="text-sm text-gray-500">วัน</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} icon={<ChevronLeft size={18} />} iconPosition="left">
          กลับ
        </Button>
        <Button onClick={onNext} icon={<ChevronRight size={18} />}>
          ถัดไป
        </Button>
      </div>
    </motion.div>
  );
}
