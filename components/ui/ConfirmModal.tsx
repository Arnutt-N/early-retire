"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import Button from "./Button";

type Variant = "danger" | "info" | "success";

interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  /** Disable the confirm button while a parent action is in flight. */
  loading?: boolean;
}

const variantConfig: Record<
  Variant,
  {
    Icon: typeof AlertTriangle;
    iconClass: string;
    iconBg: string;
    confirmVariant: "danger" | "primary" | "success";
  }
> = {
  danger: {
    Icon: AlertTriangle,
    iconClass: "text-red-600",
    iconBg: "bg-red-50",
    confirmVariant: "danger",
  },
  info: {
    Icon: Info,
    iconClass: "text-blue-600",
    iconBg: "bg-blue-50",
    confirmVariant: "primary",
  },
  success: {
    Icon: CheckCircle2,
    iconClass: "text-emerald-600",
    iconBg: "bg-emerald-50",
    confirmVariant: "success",
  },
};

export default function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management + body scroll lock + Escape handler.
  // For a destructive confirm we focus the dialog container itself, NOT the
  // confirm button — this prevents an accidental Enter press from triggering
  // the destructive action. Users must deliberately Tab to the action.
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const raf = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [open, onCancel]);

  const { Icon, iconClass, iconBg, confirmVariant } = variantConfig[variant];

  const transition = reduced
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="confirm-modal"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          onClick={onCancel}
          role="presentation"
        >
          {/* Backdrop */}
          <div
            aria-hidden
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={transition}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-md rounded-2xl bg-white p-6",
              "shadow-[var(--shadow-e4)] border border-gray-100",
              "focus:outline-none",
            )}
          >
            {/* Close (X) — secondary dismiss for mouse users */}
            <button
              type="button"
              onClick={onCancel}
              aria-label="ปิดหน้าต่าง"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <X size={18} />
            </button>

            {/* Header: icon + title */}
            <div className="flex items-start gap-4 mb-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  iconBg,
                )}
              >
                <Icon size={24} className={iconClass} />
              </div>
              <div className="flex-1 pt-1 pr-6">
                <h2
                  id={titleId}
                  className="text-lg font-bold text-gray-900 leading-snug"
                >
                  {title}
                </h2>
              </div>
            </div>

            {description && (
              <p
                id={descId}
                className="text-sm text-gray-600 leading-relaxed mb-6 pl-16"
              >
                {description}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="sm:min-w-[110px]"
              >
                {cancelLabel}
              </Button>
              <Button
                variant={confirmVariant}
                onClick={onConfirm}
                loading={loading}
                className="sm:min-w-[110px]"
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
