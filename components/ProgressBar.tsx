"use client";

import { motion } from "framer-motion";

const steps = [
  "ข้อมูลส่วนตัว",
  "เวลาราชการ",
  "ตำแหน่ง/เงินเดือน",
  "ประวัติเลื่อนเงินเดือน",
  "ผลลัพธ์",
];

interface ProgressBarProps {
  currentStep: number;
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="w-full">
      {/* Desktop: Full labels with connectors */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isCompleted
                      ? "#38a169"
                      : isActive
                      ? "#1e3a5f"
                      : "#e2e8f0",
                  }}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    text-sm font-bold transition-colors duration-300
                    ${isCompleted || isActive ? "text-white" : "text-gray-500"}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </motion.div>
                <span
                  className={`
                    mt-2 text-xs font-medium whitespace-nowrap
                    ${isActive ? "text-[var(--primary)]" : isCompleted ? "text-green-600" : "text-gray-400"}
                  `}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-3 rounded-full transition-colors duration-300
                    ${isCompleted ? "bg-green-500" : "bg-gray-200"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Dots with scroll */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-2">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <motion.div
                  animate={{
                    scale: isActive ? 1.2 : 1,
                  }}
                  className={`
                    w-3 h-3 rounded-full transition-colors duration-300
                    ${isCompleted ? "bg-green-500" : isActive ? "bg-[var(--primary)]" : "bg-gray-300"}
                  `}
                />
                {index < steps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-1 transition-colors duration-300
                      ${isCompleted ? "bg-green-500" : "bg-gray-200"}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center mt-2 text-sm font-medium text-[var(--primary)]">
          ขั้นตอนที่ {currentStep + 1}: {steps[currentStep]}
        </p>
      </div>
    </div>
  );
}
