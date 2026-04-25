"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { FormState } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CalendarPickerTH from "@/components/ui/CalendarPickerTH";
import { TrendingUp, DollarSign } from "lucide-react";

interface Props {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function SalaryHistoryForm({ form, updateForm, onNext, onBack }: Props) {
  const avgPercent = useMemo(() => {
    const vals = form.assessmentIncreases.filter((v) => !isNaN(v));
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
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center">
          <DollarSign size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold">ประวัติเลื่อนเงินเดือน</h2>
          <p className="text-sm text-gray-500">
            กรอกเงินเดือนปัจจุบันและประวัติ % การเลื่อนย้อนหลัง
          </p>
        </div>
      </div>

      <Input
        label="เงินเดือนปัจจุบัน"
        value={form.currentSalary}
        onChange={(v) => updateForm({ currentSalary: parseFloat(v) || 0 })}
        type="number"
        required
        suffix="บาท"
      />

      <CalendarPickerTH
        label="วันที่รอบประเมินล่าสุด"
        value={form.latestAssessmentDate}
        onChange={(d) => updateForm({ latestAssessmentDate: d })}
        helper="ใช้เป็นจุดเริ่มในตารางคำนวณเงินเดือน (ไม่กำหนด = ใช้ 6 เดือนก่อนวันเกษียณ)"
      />

      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp size={18} />
          % การเลื่อนเงินเดือนย้อนหลัง (6 รอบ)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {form.assessmentIncreases.map((val, i) => (
            <Input
              key={i}
              label={`รอบที่ ${i + 1}`}
              value={val}
              onChange={(v) => updateAssessment(i, v)}
              type="number"
              step={0.1}
              suffix="%"
            />
          ))}
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <p className="text-sm text-green-800">
            ค่าเฉลี่ยการเลื่อนเงินเดือน:{" "}
            <span className="font-bold">{avgPercent.toFixed(1)}%</span>
            <span className="text-green-600 ml-2">
              (ใช้เป็น default สำหรับรอบในอนาคตที่ยังไม่ทราบ)
            </span>
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          กลับ
        </Button>
        <Button onClick={onNext} icon={<TrendingUp size={18} />}>
          ถัดไป
        </Button>
      </div>
    </motion.div>
  );
}
