"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { FormState } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CalendarPickerTH from "@/components/ui/CalendarPickerTH";
import { TrendingUp, DollarSign, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function SalaryHistoryForm({ form, updateForm, onNext, onBack }: Props) {
  const avgPercent = useMemo(() => {
    const vals = form.assessmentIncreases.filter((v) => !isNaN(v) && v > 0);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [form.assessmentIncreases]);

  const updateAssessment = (index: number, value: string) => {
    const newVals = [...form.assessmentIncreases];
    newVals[index] = parseFloat(value) || 0;
    updateForm({ assessmentIncreases: newVals });
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
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
          <DollarSign size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-600 rounded-full">
              ขั้นตอนที่ 4
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">ประวัติเงินเดือน</h2>
          <p className="text-sm text-gray-500 mt-1">กรอกเงินเดือนปัจจุบันและประวัติ % การเลื่อนย้อนหลัง</p>
        </div>
      </div>

      {/* Current Salary Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={20} />
          <h3 className="font-semibold">เงินเดือนปัจจุบัน</h3>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <Input
            value={form.currentSalary}
            onChange={(v) => updateForm({ currentSalary: parseFloat(v) || 0 })}
            type="number"
            required
            suffix="บาท"
            className="!bg-white/90 !border-0 !text-gray-900 text-xl font-bold"
          />
        </div>
      </div>

      {/* Assessment Date */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-e2)] p-6">
        <CalendarPickerTH
          label="วันที่เลื่อนเงินเดือน ล่าสุด"
          value={form.latestAssessmentDate}
          onChange={(d) => updateForm({ latestAssessmentDate: d })}
          helper="ใช้เป็นจุดเริ่มในตารางคำนวณเงินเดือน (ไม่กำหนด = ใช้ 6 เดือนก่อนวันเกษียณ)"
        />
      </div>

      {/* Assessment History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-e2)] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-gray-500" />
          <h3 className="font-semibold text-gray-900">% การเลื่อนเงินเดือนย้อนหลัง (6 รอบ)</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {form.assessmentIncreases.map((val, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Input
                label={`รอบที่ ${i + 1}`}
                value={val}
                onChange={(v) => updateAssessment(i, v)}
                type="number"
                step={0.1}
                suffix="%"
                className={cn(
                  val > 0 && "!border-emerald-200 !bg-emerald-50/30"
                )}
              />
            </motion.div>
          ))}
        </div>

        {/* Average Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-500" />
              <span className="text-sm text-emerald-800">ค่าเฉลี่ยการเลื่อนเงินเดือน</span>
            </div>
            <span className="text-xl font-bold text-emerald-600">
              {avgPercent.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-emerald-600 mt-2">
            ใช้เป็นค่าเริ่มต้น สำหรับรอบในอนาคตที่ยังไม่ทราบค่า
          </p>
        </motion.div>
      </div>

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
