"use client";

import React, { useState, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
  id?: string;
  className?: string;
}

export function Tooltip({
  children,
  content,
  placement = "top",
  delay = 200,
  id,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const generatedId = useId();
  const tooltipId = id || `tooltip-${generatedId}`;

  const show = () => {
    const tid = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(tid);
  };

  const hide = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const placementClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses: Record<string, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-gray-800",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-800",
    left: "left-full top-1/2 -translate-y-1/2 border-l-gray-800",
    right: "right-full top-1/2 -translate-y-1/2 border-r-gray-800",
  };

  const arrowBorders: Record<string, string> = {
    top: "border-4 border-transparent border-t-gray-800",
    bottom: "border-4 border-transparent border-b-gray-800",
    left: "border-4 border-transparent border-l-gray-800",
    right: "border-4 border-transparent border-r-gray-800",
  };

  const child = React.Children.only(children);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        "aria-describedby": isVisible ? tooltipId : undefined,
      })}
      <AnimatePresence>
        {isVisible && (
          <motion.span
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 px-3 py-1.5 text-sm text-white bg-gray-800 rounded-md shadow-lg whitespace-nowrap pointer-events-none",
              placementClasses[placement],
              className
            )}
          >
            {content}
            <span
              className={cn(
                "absolute w-0 h-0",
                arrowClasses[placement],
                arrowBorders[placement]
              )}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
