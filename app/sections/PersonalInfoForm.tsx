"use client";

import { motion } from "framer-motion";
import DatePickerTH from "@/components/DatePickerTH";
import Button from "@/components/ui/Button";
import { calculateRetirementDate } from "@/lib/calculations";
import { FormState } from "@/types";
import { ChevronRight, User, Calendar, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
  onNext: () => void;
}

const retirementOptions = [
  { 
    value: "age60" as const, 
    label: "เกษียณอายุ 60 ปี", 
    description: "คำนวณอัตโนมัติจากวันเกิด",
    recommended: true
  },
  { 
    value: "service25" as const, 
    label: "อายุราชการ 25 ปี", 
    description: "คำนวณจากวันบรรจุ + 25 ปี",
    recommended: false
  },
  { 
    value: "custom" as const, 
    label: "กำหนดเอง", 
    description: "เลือกวันที่ด้วยตัวเอง",
    recommended: false
  },
] as const;

export default function PersonalInfoForm({ form, updateForm, onNext }: Props) {
  const handleRetirementOption = (option: FormState["retirementOption"]) => {
    updateForm({ retirementOption: option });

    if (option === "age60" && form.birthDate) {
      const birth = new Date(form.birthDate);
      const retire = calculateRetirementDate(birth);
      updateForm({ endDate: retire.toISOString() });
    } else if (option === "service25" && form.startDate) {
      const start = new Date(form.startDate);
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 25);
      updateForm({ endDate: end.toISOString() });
    }
  };

  const isValid = form.birthDate && form.startDate && form.endDate;
  const endAfterStart =
    form.startDate && form.endDate
      ? new Date(form.endDate) > new Date(form.startDate)
      : true;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
          <User size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
              ขั้นตอนที่ 2
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">ข้อมูลส่วนตัว</h2>
          <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลพื้นฐานสำหรับการคำนวณบำเหน็จบำนาญ</p>
        </div>
      </div>

      {/* Date Inputs Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[var(--shadow-e2)] p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DatePickerTH
            label="วันเดือนปีเกิด"
            value={form.birthDate}
            onChange={(d) => {
              updateForm({ birthDate: d });
              // Auto-calculate retirement date if age60 is selected
              if (form.retirementOption === "age60" && d) {
                const birth = new Date(d);
                const retire = calculateRetirementDate(birth);
                updateForm({ endDate: retire.toISOString() });
              }
            }}
            required
            helper="พิมพ์ วว/ดด/ปปปป (พ.ศ.) หรือเลือกจากปฏิทิน"
          />
          <DatePickerTH
            label="วันบรรจุ"
            value={form.startDate}
            onChange={(d) => {
              updateForm({ startDate: d });
              // Auto-calculate if service25 is selected
              if (form.retirementOption === "service25" && d) {
                const start = new Date(d);
                const end = new Date(start);
                end.setFullYear(end.getFullYear() + 25);
                updateForm({ endDate: end.toISOString() });
              }
            }}
            required
            helper="วันที่เริ่มรับราชการ"
          />
        </div>
      </div>

      {/* Retirement Date Selection */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-[var(--shadow-e1)] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-gray-500" />
          <label className="text-base font-semibold text-gray-900">
            วันที่พ้นส่วนราชการ
            <span className="text-red-500 ml-1">*</span>
          </label>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {retirementOptions.map((opt) => {
            const isSelected = form.retirementOption === opt.value;
            return (
              <motion.button
                key={opt.value}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRetirementOption(opt.value)}
                className={cn(
                  "relative p-4 rounded-xl text-left transition-all duration-200",
                  "border-2",
                  isSelected
                    ? "border-blue-500 bg-blue-50/50 shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200"
                )}
              >
                {opt.recommended && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full flex items-center gap-1">
                    <Sparkles size={10} />
                    แนะนำ
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
                    isSelected ? "border-blue-500" : "border-gray-300"
                  )}>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-blue-500"
                      />
                    )}
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium text-sm",
                      isSelected ? "text-blue-700" : "text-gray-700"
                    )}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Date Picker */}
        <div className="pt-2">
          <DatePickerTH
            value={form.endDate}
            onChange={(d) => {
              updateForm({ endDate: d, retirementOption: "custom" });
            }}
            helper={
              form.retirementOption === "age60"
                ? "✨ คำนวณอัตโนมัติจากวันเกิด (+ 1 ปีหากเกิดตั้งแต่ 1 ต.ค.)"
                : form.retirementOption === "service25"
                ? "✨ คำนวณอัตโนมัติจากวันบรรจุ + 25 ปี"
                : "กรอกวันที่พ้นส่วนราชการ"
            }
          />
        </div>
      </div>

      {/* Error Message */}
      {!endAfterStart && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600"
        >
          <AlertCircle size={18} />
          <p className="text-sm font-medium">วันที่พ้นส่วนราชการต้องมากกว่าวันบรรจุ</p>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!isValid || !endAfterStart}
          size="lg"
          icon={<ChevronRight size={20} />}
        >
          ถัดไป
        </Button>
      </div>
    </motion.div>
  );
}
