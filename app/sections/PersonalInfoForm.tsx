"use client";

import { motion } from "framer-motion";
import DatePickerTH from "@/components/DatePickerTH";
import Button from "@/components/ui/Button";
import { calculateRetirementDate } from "@/lib/calculations";
import { FormState } from "@/types";
import { Calendar, User } from "lucide-react";

interface Props {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
  onNext: () => void;
}

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
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
          <User size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">ข้อมูลส่วนตัว</h2>
          <p className="text-sm text-[var(--text-muted)]">กรอกข้อมูลพื้นฐานสำหรับการคำนวณ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DatePickerTH
          label="วันเดือนปีเกิด"
          value={form.birthDate}
          onChange={(d) => updateForm({ birthDate: d })}
          required
          helper="กรอกในรูปแบบ วว/ดด/ปปปป (พ.ศ.)"
        />
        <DatePickerTH
          label="วันบรรจุ"
          value={form.startDate}
          onChange={(d) => updateForm({ startDate: d })}
          required
          helper="วันที่เริ่มรับราชการ"
        />
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <label className="block text-sm font-medium text-[var(--text)] mb-3">
          วันที่พ้นส่วนราชการ <span className="text-[var(--danger)]">*</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            { value: "age60", label: "เกษียณอายุ 60 ปี" },
            { value: "service25", label: "อายุราชการ 25 ปี" },
            { value: "custom", label: "กำหนดเอง" },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleRetirementOption(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                form.retirementOption === opt.value
                  ? "bg-[var(--primary)] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[var(--primary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <DatePickerTH
          value={form.endDate}
          onChange={(d) => {
            updateForm({ endDate: d, retirementOption: "custom" });
          }}
          helper={
            form.retirementOption === "age60"
              ? "คำนวณอัตโนมัติจากวันเกิด (บวก 1 ปีหากเกิดตั้งแต่ 1 ต.ค.)"
              : form.retirementOption === "service25"
              ? "คำนวณอัตโนมัติจากวันบรรจุ + 25 ปี"
              : "กรอกวันที่พ้นส่วนราชการ"
          }
        />
      </div>

      {!endAfterStart && (
        <p className="text-sm text-[var(--danger)]">
          วันที่พ้นส่วนราชการต้องมากกว่าวันบรรจุ
        </p>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!isValid || !endAfterStart}
          icon={<Calendar size={18} />}
        >
          ถัดไป
        </Button>
      </div>
    </motion.div>
  );
}
