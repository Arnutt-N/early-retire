"use client";

import { motion } from "framer-motion";
import type {
  PensionResult,
  LivelihoodResult,
  ServicePeriod,
  SalaryRecord,
} from "@/lib/calculations";
import { formatNumber, formatThaiDate } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SocialShare from "@/components/SocialShare";
import { Award, Calendar, TrendingUp, User, Printer, Info } from "lucide-react";

interface Props {
  mode: "gfp" | "non-gfp" | null;
  birthDate: string | null;
  startDate: string | null;
  endDate: string | null;
  servicePeriod: ServicePeriod | null;
  result: PensionResult | null;
  livelihood: LivelihoodResult | null;
  salaryRecords: SalaryRecord[];
  onBack: () => void;
}

export default function ResultSection({
  mode,
  birthDate,
  startDate,
  endDate,
  servicePeriod,
  result,
  livelihood,
  salaryRecords,
  onBack,
}: Props) {
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const modeLabel = mode === "gfp" ? "เป็นสมาชิก กบข." : "ไม่เป็นสมาชิก กบข.";
  const formulaNote =
    mode === "gfp"
      ? "เลือกจ่ายต่ำสุดจาก: เงินเฉลี่ย 60 เดือน × ปีราชการ ÷ 50  หรือ  เงินเฉลี่ย 60 เดือน × 0.70"
      : "คำนวณจาก: เงินเดือนเดือนสุดท้าย × ปีราชการ ÷ 50";

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
          <h2 className="text-xl font-bold">ผลการคำนวณ</h2>
          <p className="text-sm text-gray-500">
            สรุปบำเหน็จบำนาญที่จะได้รับ — กรณี{" "}
            <span className="font-semibold text-[var(--color-primary)]">{modeLabel}</span>
          </p>
        </div>
      </div>

      {/* Personal summary */}
      <Card hover={false} elevation="e2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <User size={20} className="text-[var(--color-primary)]" />
            <div>
              <p className="text-xs text-gray-500">วันเกิด</p>
              <p className="font-medium">{formatThaiDate(birthDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-[var(--color-primary)]" />
            <div>
              <p className="text-xs text-gray-500">วันบรรจุ - เกษียณ</p>
              <p className="font-medium">
                {formatThaiDate(startDate)} - {formatThaiDate(endDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-[var(--color-primary)]" />
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

      {/* Main results — show all amounts always */}
      {result ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              hover={false}
              elevation="e2"
              header={<h3 className="font-semibold">เงินบำเหน็จ (ก้อน)</h3>}
            >
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-[var(--color-primary)]">
                  {formatNumber(result.lumpSum)}
                </p>
                <p className="text-sm text-gray-500 mt-1">บาท</p>
              </div>
              <p className="text-xs text-gray-400 text-center">
                คำนวณจาก{" "}
                {mode === "gfp" ? "เงินเฉลี่ย 60 เดือน × ปีราชการ" : "เงินเดือนเดือนสุดท้าย × ปีราชการ"}
              </p>
            </Card>

            <Card
              hover={false}
              elevation="e2"
              header={<h3 className="font-semibold">เงินบำนาญรายเดือน</h3>}
            >
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-green-700">
                  {formatNumber(result.monthly)}
                </p>
                <p className="text-sm text-gray-500 mt-1">บาท / เดือน</p>
              </div>
              <p className="text-xs text-gray-400 text-center">{formulaNote}</p>
            </Card>
          </div>

          {livelihood && (
            <Card
              hover={false}
              elevation="e2"
              header={<h3 className="font-semibold">บำเหน็จดำรงชีพ</h3>}
            >
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  รวม {formatNumber(livelihood.total)} บาท (บำนาญรายเดือน × 15) แบ่งจ่าย 3 ครั้ง:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {livelihood.rounds.map((r) => (
                    <div key={r.round} className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500">{r.label}</p>
                      <p className="text-xl font-bold mt-1">{formatNumber(r.amount)}</p>
                      <p className="text-xs text-gray-400">บาท</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card hover={false} elevation="e1">
          <p className="text-center text-gray-500 py-6">
            กรุณากรอกข้อมูลในขั้นตอนก่อนหน้าให้ครบเพื่อดูผลคำนวณ
          </p>
        </Card>
      )}

      {/* Salary summary */}
      {salaryRecords.length > 0 && (
        <Card
          hover={false}
          elevation="e2"
          header={<h3 className="font-semibold">สรุปเงินเดือน</h3>}
        >
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
            {mode === "gfp" && (
              <div>
                <p className="text-gray-500">เงินเฉลี่ย 60 เดือน</p>
                <p className="font-medium">
                  {formatNumber(
                    salaryRecords.reduce((s, r) => s + r.newSalary, 0) /
                      (salaryRecords.length || 1),
                  )}{" "}
                  บาท
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">หมายเหตุ</p>
          <p>
            ผลการคำนวณข้างต้นเป็น{" "}
            <span className="font-semibold">ประมาณการเบื้องต้น</span> เท่านั้น
            โปรดตรวจสอบกับกองบริหารทรัพยากรบุคคล สำนักงานปลัดกระทรวงยุติธรรม
            อีกครั้งก่อนตัดสินใจทางการเงิน
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
        <Button variant="outline" onClick={onBack}>
          กลับไปแก้ไข
        </Button>
        <Button variant="secondary" onClick={handlePrint} icon={<Printer size={18} />}>
          พิมพ์ / บันทึก PDF
        </Button>
      </div>

      <SocialShare />
    </motion.div>
  );
}
