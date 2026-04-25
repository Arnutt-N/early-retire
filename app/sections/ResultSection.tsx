"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PensionResult, LivelihoodResult, ServicePeriod, SalaryRecord } from "@/lib/calculations";
import { formatNumber, formatThaiDate } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SocialShare from "@/components/SocialShare";
import { Award, Calendar, TrendingUp, User, Printer } from "lucide-react";

interface Props {
  birthDate: string | null;
  startDate: string | null;
  endDate: string | null;
  servicePeriod: ServicePeriod | null;
  nonGfpResult: PensionResult | null;
  gfpResult: PensionResult | null;
  nonGfpLivelihood: LivelihoodResult | null;
  gfpLivelihood: LivelihoodResult | null;
  salaryRecords: SalaryRecord[];
  onBack: () => void;
}

export default function ResultSection({
  birthDate,
  startDate,
  endDate,
  servicePeriod,
  nonGfpResult,
  gfpResult,
  nonGfpLivelihood,
  gfpLivelihood,
  salaryRecords,
  onBack,
}: Props) {
  const [mode, setMode] = useState<"non-gfp" | "gfp">("non-gfp");
  const result = mode === "non-gfp" ? nonGfpResult : gfpResult;
  const livelihood = mode === "non-gfp" ? nonGfpLivelihood : gfpLivelihood;

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
          <Award size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">ผลการคำนวณ</h2>
          <p className="text-sm text-[var(--text-muted)]">สรุปบำเหน็จบำนาญที่จะได้รับ</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setMode("non-gfp")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "non-gfp"
              ? "bg-white text-[var(--primary)] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ไม่เป็นสมาชิก กบข.
        </button>
        <button
          onClick={() => setMode("gfp")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            mode === "gfp"
              ? "bg-white text-[var(--primary)] shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          เป็นสมาชิก กบข.
        </button>
      </div>

      {/* Personal Summary */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <User size={20} className="text-[var(--primary)]" />
            <div>
              <p className="text-xs text-gray-500">วันเกิด</p>
              <p className="font-medium">{formatThaiDate(birthDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-[var(--primary)]" />
            <div>
              <p className="text-xs text-gray-500">วันบรรจุ - เกษียณ</p>
              <p className="font-medium">
                {formatThaiDate(startDate)} - {formatThaiDate(endDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-[var(--primary)]" />
            <div>
              <p className="text-xs text-gray-500">อายุราชการ</p>
              <p className="font-medium">
                {servicePeriod
                  ? `${servicePeriod.years} ปี ${servicePeriod.months} เดือน ${servicePeriod.days} วัน`
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Main Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                header={<h3 className="font-semibold text-[var(--text)]">เงินบำเหน็จ (ก้อน)</h3>}
                className="bg-gradient-to-br from-blue-50 to-white"
              >
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-[var(--primary)]">
                    {formatNumber(result.lumpSum)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">บาท</p>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  คำนวณจากเงินเดือนเดือนสุดท้าย × อายุราชการ
                </p>
              </Card>

              <Card
                header={<h3 className="font-semibold text-[var(--text)]">เงินบำนาญรายเดือน</h3>}
                className="bg-gradient-to-br from-green-50 to-white"
              >
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-green-700">
                    {formatNumber(result.monthly)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">บาท/เดือน</p>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {mode === "gfp"
                    ? "เลือกจ่ายต่ำสุดจากสูตร (2.1) หรือ (2.2)"
                    : "คำนวณจากเงินเดือนเดือนสุดท้าย × อายุราชการ / 50"}
                </p>
              </Card>
            </div>

            {/* Livelihood */}
            {livelihood && (
              <Card
                header={
                  <h3 className="font-semibold text-[var(--text)]">บำเหน็จดำรงชีพ</h3>
                }
              >
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    รวม {formatNumber(livelihood.total)} บาท (บำนาญ × 15) แบ่งจ่าย 3 ครั้ง:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {livelihood.rounds.map((r) => (
                      <div
                        key={r.round}
                        className="bg-gray-50 rounded-xl p-4 text-center"
                      >
                        <p className="text-xs text-gray-500">{r.label}</p>
                        <p className="text-xl font-bold text-[var(--text)] mt-1">
                          {formatNumber(r.amount)}
                        </p>
                        <p className="text-xs text-gray-400">บาท</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Salary Summary */}
      {salaryRecords.length > 0 && (
        <Card header={<h3 className="font-semibold text-[var(--text)]">สรุปเงินเดือน</h3>}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">จำนวนรอบ</p>
              <p className="font-medium">{salaryRecords.length} รอบ</p>
            </div>
            <div>
              <p className="text-gray-500">เงินเดือนเริ่มต้น</p>
              <p className="font-medium">{formatNumber(salaryRecords[0]?.oldSalary || 0)} บาท</p>
            </div>
            <div>
              <p className="text-gray-500">เงินเดือนสุดท้าย</p>
              <p className="font-medium">
                {formatNumber(salaryRecords[salaryRecords.length - 1]?.newSalary || 0)} บาท
              </p>
            </div>
            <div>
              <p className="text-gray-500">เงินเฉลี่ย 60 เดือน (กบข.)</p>
              <p className="font-medium">
                {mode === "gfp"
                  ? `${formatNumber(
                      salaryRecords.reduce((s, r) => s + r.newSalary, 0) /
                        (salaryRecords.length || 1)
                    )} บาท`
                  : "-"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          กลับไปแก้ไข
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePrint} icon={<Printer size={18} />}>
            พิมพ์ / บันทึก PDF
          </Button>
        </div>
      </div>

      <SocialShare />
    </motion.div>
  );
}
