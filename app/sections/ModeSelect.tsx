"use client";

import { motion } from "framer-motion";
import { useRef, type KeyboardEvent } from "react";
import { CreditCard, ShieldCheck, ChevronRight, Sparkles, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { FormState } from "@/types";

interface Props {
  form: FormState;
  updateForm: (updates: Partial<FormState>) => void;
  onNext: () => void;
}

const MODES = ["non-gfp", "gfp"] as const;
type ModeValue = (typeof MODES)[number];

const modeConfig: Record<ModeValue, {
  title: string;
  description: string;
  details: string[];
  icon: typeof CreditCard;
  gradient: string;
  iconBg: string;
  accentColor: string;
}> = {
  "gfp": {
    title: "เป็นสมาชิก กบข.",
    description: "กองทุนบำเหน็จบำนาญข้าราชการ",
    details: [
      "ใช้เงินเฉลี่ย 60 เดือนสุดท้าย",
      "ได้รับเงินสะสมจาก กบข. เพิ่มเติม",
      "สิทธิประโยชน์ทางภาษี"
    ],
    icon: CreditCard,
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-50",
    accentColor: "text-emerald-600"
  },
  "non-gfp": {
    title: "ไม่เป็นสมาชิก กบข.",
    description: "ระบบบำเหน็จบำนาญเดิม (ก่อน พ.ศ. 2540)",
    details: [
      "ใช้เงินเดือนเดือนสุดท้าย",
      "คำนวณตามสูตรเดิม",
      "ไม่มีเงินสะสม กบข."
    ],
    icon: ShieldCheck,
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-blue-50",
    accentColor: "text-blue-600"
  }
};

export default function ModeSelect({ form, updateForm, onNext }: Props) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusByIndex = (idx: number) => {
    const wrapped = ((idx % MODES.length) + MODES.length) % MODES.length;
    buttonRefs.current[wrapped]?.focus();
    updateForm({ mode: MODES[wrapped] });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        focusByIndex(idx + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        focusByIndex(idx - 1);
        break;
      case "Home":
        e.preventDefault();
        focusByIndex(0);
        break;
      case "End":
        e.preventDefault();
        focusByIndex(MODES.length - 1);
        break;
    }
  };

  const tabbableIndex: number =
    form.mode === null ? 0 : MODES.findIndex((m) => m === form.mode);

  const isModeSelected = (m: ModeValue) => form.mode === m;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-100"
        >
          <Sparkles size={16} className="text-blue-500" />
          <span className="text-sm font-medium text-blue-700">ขั้นตอนที่ 1</span>
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          คุณเป็นสมาชิก กบข. หรือไม่?
        </h2>
        <p className="text-gray-500 max-w-md mx-auto">
          เลือกประเภทการคำนวณที่ตรงกับสถานะของคุณ เพื่อผลลัพธ์ที่แม่นยำ
        </p>
      </div>

      {/* Mode Cards */}
      <div
        role="radiogroup"
        aria-label="ประเภทสมาชิก กบข."
        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
      >
        {MODES.map((mode, idx) => {
          const config = modeConfig[mode];
          const Icon = config.icon;
          const selected = isModeSelected(mode);
          
          return (
            <motion.button
              key={mode}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={tabbableIndex === idx ? 0 : -1}
              onClick={() => updateForm({ mode })}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "relative rounded-2xl p-6 text-left transition-all duration-200 group",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                "border-2 overflow-hidden",
                selected
                  ? "border-transparent bg-white shadow-[var(--shadow-e3)]"
                  : "border-gray-100 bg-white hover:border-gray-200 shadow-[var(--shadow-e1)] hover:shadow-[var(--shadow-e2)]",
              )}
            >
              {/* Selected indicator gradient border */}
              {selected && (
                <div className={cn(
                  "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-100 -z-10",
                  config.gradient
                )} style={{ padding: '2px' }}>
                  <div className="absolute inset-[2px] rounded-[14px] bg-white" />
                </div>
              )}
              
              {/* Check mark */}
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "absolute top-4 right-4 w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center",
                    config.gradient
                  )}
                >
                  <Check size={14} className="text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Icon */}
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors",
                config.iconBg,
                selected && "shadow-sm"
              )}>
                <Icon size={28} className={config.accentColor} />
              </div>

              {/* Content */}
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {config.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {config.description}
              </p>

              {/* Details */}
              <ul className="space-y-2">
                {config.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                      selected ? `bg-gradient-to-br ${config.gradient}` : "bg-gray-300"
                    )} />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.button>
          );
        })}
      </div>

      {/* Next Button */}
      <motion.div 
        className="flex justify-center pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          onClick={onNext}
          disabled={!form.mode}
          size="lg"
          icon={<ChevronRight size={20} />}
          className="min-w-[200px]"
        >
          เริ่มคำนวณ
        </Button>
      </motion.div>
    </motion.div>
  );
}
