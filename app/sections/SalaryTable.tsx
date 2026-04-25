"use client";

import { motion } from "framer-motion";
import { SalaryRecord } from "@/lib/calculations";
import { formatNumber } from "@/lib/utils";
import { Table, TrendingUp } from "lucide-react";
import Button from "@/components/ui/Button";

interface Props {
  records: SalaryRecord[];
  onNext: () => void;
  onBack: () => void;
}

export default function SalaryTableSection({ records, onNext, onBack }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
          <Table size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">ตารางเงินเดือน</h2>
          <p className="text-sm text-[var(--text-muted)]">
            ประมาณการเงินเดือนตามรอบการประเมิน
          </p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block table-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left font-semibold text-gray-600">รอบ</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-600">ระดับ</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">เงินเดือนเดิม</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">ขั้นสูง</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">ฐาน</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">%เลื่อน</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">เงินที่เลื่อน</th>
              <th className="px-3 py-3 text-right font-semibold text-gray-600">เงินเดือนใหม่</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-gray-100 ${
                  r.isCurrent ? "bg-yellow-50" : r.isEstimated ? "bg-gray-50/50" : ""
                }`}
              >
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {r.periodLabel}
                  {r.isEstimated && (
                    <span className="ml-1 text-xs text-gray-400">(ประมาณ)</span>
                  )}
                  {r.isCurrent && (
                    <span className="ml-1 text-xs text-amber-600 font-medium">(ปัจจุบัน)</span>
                  )}
                </td>
                <td className="px-3 py-2.5">{r.level}</td>
                <td className="px-3 py-2.5 text-right">{formatNumber(r.oldSalary)}</td>
                <td className="px-3 py-2.5 text-right">{formatNumber(r.maxSalary)}</td>
                <td className="px-3 py-2.5 text-right">{formatNumber(r.base)}</td>
                <td className="px-3 py-2.5 text-right">{r.percent}%</td>
                <td className="px-3 py-2.5 text-right">{formatNumber(r.actualIncrease)}</td>
                <td className="px-3 py-2.5 text-right font-medium">{formatNumber(r.newSalary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {records.map((r, i) => (
          <div
            key={i}
            className={`bg-white border rounded-xl p-4 space-y-2 ${
              r.isCurrent ? "border-amber-300 bg-amber-50" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{r.periodLabel}</span>
              {r.isEstimated && <span className="text-xs text-gray-400">ประมาณ</span>}
              {r.isCurrent && <span className="text-xs text-amber-600 font-medium">ปัจจุบัน</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">ระดับ</p>
                <p>{r.level}</p>
              </div>
              <div>
                <p className="text-gray-500">% เลื่อน</p>
                <p>{r.percent}%</p>
              </div>
              <div>
                <p className="text-gray-500">เงินเดือนเดิม</p>
                <p>{formatNumber(r.oldSalary)}</p>
              </div>
              <div>
                <p className="text-gray-500">เงินที่เลื่อน</p>
                <p>{formatNumber(r.actualIncrease)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">เงินเดือนใหม่</p>
                <p className="text-lg font-bold text-[var(--primary)]">{formatNumber(r.newSalary)} บาท</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {records.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Table size={48} className="mx-auto mb-3 opacity-50" />
          <p>กรุณากรอกข้อมูลเงินเดือนและตำแหน่งก่อน</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          กลับ
        </Button>
        <Button onClick={onNext} icon={<TrendingUp size={18} />}>
          ดูผลลัพธ์
        </Button>
      </div>
    </motion.div>
  );
}
