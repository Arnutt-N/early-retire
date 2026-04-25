"use client";

import { motion } from "framer-motion";
import { useRef, type KeyboardEvent } from "react";
import { CreditCard, ShieldCheck, ChevronRight } from "lucide-react";
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

  // Per ARIA radiogroup spec: the selected radio is in the tab order; if none
  // selected, the first radio takes the slot.
  const tabbableIndex: number =
    form.mode === null ? 0 : MODES.findIndex((m) => m === form.mode);

  const isModeSelected = (m: ModeValue) => form.mode === m;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
          คุณเป็นสมาชิก กบข. หรือไม่?
        </h2>
        <p className="text-sm text-gray-500">
          เลือกประเภทเพื่อเริ่มคำนวณบำเหน็จบำนาญ
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="ประเภทสมาชิก กบข."
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <button
          ref={(el) => {
            buttonRefs.current[0] = el;
          }}
          type="button"
          role="radio"
          aria-checked={isModeSelected("non-gfp")}
          tabIndex={tabbableIndex === 0 ? 0 : -1}
          onClick={() => updateForm({ mode: "non-gfp" })}
          onKeyDown={(e) => handleKeyDown(e, 0)}
          className={cn(
            "rounded-2xl border-2 p-6 text-left transition-all duration-[var(--duration-fast)] min-h-[160px] flex flex-col items-start gap-3",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]",
            isModeSelected("non-gfp")
              ? "border-[var(--color-primary)] bg-[var(--color-secondary)] shadow-[var(--shadow-e2)]"
              : "border-gray-200 bg-white hover:border-[var(--color-primary-light)] shadow-[var(--shadow-e1)]",
          )}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 text-[var(--color-primary)]">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-base">ไม่เป็นสมาชิก กบข.</h3>
          <p className="text-xs text-gray-500">
            ใช้เงินเดือนเดือนสุดท้ายในการคำนวณ
          </p>
        </button>

        <button
          ref={(el) => {
            buttonRefs.current[1] = el;
          }}
          type="button"
          role="radio"
          aria-checked={isModeSelected("gfp")}
          tabIndex={tabbableIndex === 1 ? 0 : -1}
          onClick={() => updateForm({ mode: "gfp" })}
          onKeyDown={(e) => handleKeyDown(e, 1)}
          className={cn(
            "rounded-2xl border-2 p-6 text-left transition-all duration-[var(--duration-fast)] min-h-[160px] flex flex-col items-start gap-3",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]",
            isModeSelected("gfp")
              ? "border-[var(--color-primary)] bg-[var(--color-secondary)] shadow-[var(--shadow-e2)]"
              : "border-gray-200 bg-white hover:border-[var(--color-primary-light)] shadow-[var(--shadow-e1)]",
          )}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-50 text-green-700">
            <CreditCard size={24} />
          </div>
          <h3 className="font-bold text-base">เป็นสมาชิก กบข.</h3>
          <p className="text-xs text-gray-500">
            ใช้เงินเฉลี่ย 60 เดือนสุดท้ายในการคำนวณ
          </p>
        </button>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!form.mode}
          icon={<ChevronRight size={18} />}
        >
          ถัดไป
        </Button>
      </div>
    </motion.div>
  );
}
