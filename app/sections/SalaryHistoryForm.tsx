"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { FormState } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { TrendingUp, DollarSign } from "lucide-react";
import positionMap from "@/data/position-map.json";
import salaryBases from "@/data/salary-bases.json";

interface Props {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function SalaryHistoryForm({ form, updateForm, onNext, onBack }: Props) {
  const positions = Object.keys(positionMap);
  const levels = useMemo(() => {
    const pos = positionMap[form.position as keyof typeof positionMap];
    if (!pos) return [];
    return Object.values(pos).filter(Boolean);
  }, [form.position]);

  const baseInfo = useMemo(() => {
    if (!form.position) return null;
    const pos = positionMap[form.position as keyof typeof positionMap];
    if (!pos) return null;
    const level = (pos as Record<string, string>)[form.levelCategory || "general"] || Object.values(pos)[0];
    return salaryBases.find((b) => b.level === level);
  }, [form.position, form.levelCategory]);

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
        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
          <DollarSign size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">ตำแหน่งและเงินเดือน</h2>
          <p className="text-sm text-[var(--text-muted)]">ข้อมูลตำแหน่งและประวัติการเลื่อนเงินเดือน</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
            ตำแหน่ง <span className="text-[var(--danger)]">*</span>
          </label>
          <select
            value={form.position}
            onChange={(e) => updateForm({ position: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">เลือกตำแหน่ง</option>
            {positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
            ประเภทตำแหน่ง
          </label>
          <select
            value={form.levelCategory || "general"}
            onChange={(e) => updateForm({ levelCategory: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="general">ทั่วไป</option>
            <option value="academic">วิชาการ</option>
            <option value="admin">อำนวยการ</option>
            <option value="management">บริหาร</option>
          </select>
        </div>
      </div>

      {levels.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-[var(--text-muted)] mb-1">ระดับตำแหน่งที่เกี่ยวข้อง</p>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <span
                key={level}
                className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-sm text-[var(--text)]"
              >
                {level}
              </span>
            ))}
          </div>
        </div>
      )}

      {baseInfo && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2">ข้อมูลฐานเงินเดือน: {baseInfo.level}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-blue-600">เงินเดือนเต็มขั้น</p>
              <p className="font-bold text-blue-800">{baseInfo.fullSalary.toLocaleString()} บาท</p>
            </div>
            <div>
              <p className="text-blue-600">ฐานบน</p>
              <p className="font-bold text-blue-800">{baseInfo.baseTop.toLocaleString()} บาท</p>
            </div>
            <div>
              <p className="text-blue-600">ฐานล่าง</p>
              <p className="font-bold text-blue-800">{baseInfo.baseBottom.toLocaleString()} บาท</p>
            </div>
            <div>
              <p className="text-blue-600">ค่ากลาง</p>
              <p className="font-bold text-blue-800">{baseInfo.baseMid.toLocaleString()} บาท</p>
            </div>
          </div>
        </div>
      )}

      <Input
        label="เงินเดือนปัจจุบัน"
        value={form.currentSalary}
        onChange={(v) => updateForm({ currentSalary: parseFloat(v) || 0 })}
        type="number"
        required
        suffix="บาท"
      />

      <div className="space-y-3">
        <h3 className="font-semibold text-[var(--text)] flex items-center gap-2">
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
            ค่าเฉลี่ยการเลื่อนเงินเดือน: <span className="font-bold">{avgPercent.toFixed(1)}%</span>
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
