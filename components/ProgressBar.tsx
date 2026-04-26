"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 0, label: "เลือกประเภท", shortLabel: "ประเภท" },
  { id: 1, label: "ข้อมูลส่วนตัว", shortLabel: "ข้อมูล" },
  { id: 2, label: "เวลาราชการ", shortLabel: "เวลา" },
  { id: 3, label: "ประวัติเงินเดือน", shortLabel: "เงินเดือน" },
  { id: 4, label: "การคำนวณ", shortLabel: "คำนวณ" },
  { id: 5, label: "ผลลัพธ์", shortLabel: "ผลลัพธ์" },
];

interface ProgressBarProps {
  currentStep: number;
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Desktop Version */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Background track */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 rounded-full" />
          
          {/* Progress fill */}
          <motion.div
            className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Steps */}
          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 z-10",
                      isCompleted
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md"
                        : isActive
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg ring-4 ring-blue-100"
                          : "bg-white border-2 border-gray-200 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check size={18} strokeWidth={3} />
                    ) : (
                      index + 1
                    )}
                    
                    {/* Active pulse */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-blue-500"
                        animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  
                  <span
                    className={cn(
                      "mt-3 text-xs font-medium whitespace-nowrap transition-colors duration-200",
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                          ? "text-green-600"
                          : "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div className="md:hidden">
        <div className="flex items-center gap-3">
          {/* Progress circle */}
          <div className="relative">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="3"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${progress * 0.94} 100`}
                initial={{ strokeDasharray: "0 100" }}
                animate={{ strokeDasharray: `${progress * 0.94} 100` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">
                {currentStep + 1}/{steps.length}
              </span>
            </div>
          </div>

          {/* Step info */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {steps[currentStep].label}
            </p>
            <p className="text-xs text-gray-500">
              {currentStep < steps.length - 1 
                ? `ถัดไป: ${steps[currentStep + 1].label}`
                : "ขั้นตอนสุดท้าย"}
            </p>
          </div>

          {/* Mini dots */}
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index < currentStep
                    ? "bg-green-500"
                    : index === currentStep
                      ? "bg-blue-500 scale-125"
                      : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
