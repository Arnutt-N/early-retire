"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  hover?: boolean;
}

export default function Card({ children, className = "", header, footer, hover = true }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" } : undefined}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
    >
      {header && <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">{header}</div>}
      <div className="p-6">{children}</div>
      {footer && <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">{footer}</div>}
    </motion.div>
  );
}
