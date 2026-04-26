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
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import SocialShare from "@/components/SocialShare";
import { Award, Calendar, TrendingUp, User, Printer, Info, Wallet, Gift, ChevronLeft, Sparkles, Check, X, Scale } from "lucide-react";

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
      ? "เลือกจ่ายต่ำสุดจาก: เงินเฉลี่ย 60 เดือน × ปีราชการ ÷ 50 หรือ เงินเฉลี่ย 60 เดือน × 0.70"
      : "คำนวณจาก: เงินเดือนเดือนสุดท้าย × ปีราชการ ÷ 50";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg">
          <Award size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-600 rounded-full flex items-center gap-1">
              <Sparkles size={12} />
              ผลการคำนวณ
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">สรุปบำเหน็จบำนาญ</h2>
          <p className="text-sm text-gray-500 mt-1">
            กรณี <span className="font-semibold text-violet-600">{modeLabel}</span>
          </p>
        </div>
      </div>

      {/* Personal Info Card */}
      <Card hover={false} elevation="e2" className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">วันเกิด</p>
              <p className="font-semibold text-gray-900">{formatThaiDate(birthDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Calendar size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">วันบรรจุ - เกษียณ</p>
              <p className="font-semibold text-gray-900 text-sm">
                {formatThaiDate(startDate)} - {formatThaiDate(endDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">อายุราชการ</p>
              <p className="font-semibold text-gray-900">
                {servicePeriod
                  ? `${servicePeriod.years} ปี ${servicePeriod.months} เดือน ${servicePeriod.days} วัน`
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Results */}
      {result ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lump Sum */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Wallet size={20} />
                <h3 className="font-semibold">เงินบำเหน็จ (ก้อน)</h3>
              </div>
              <div className="text-center py-4">
                <AnimatedNumber
                  value={result.lumpSum}
                  decimals={2}
                  className="text-4xl md:text-5xl font-bold block thai-num"
                />
                <p className="text-blue-100 mt-2">บาท</p>
              </div>
              <p className="text-xs text-blue-200 text-center mt-4 pt-4 border-t border-white/20">
                {mode === "gfp" ? "เงินเฉลี่ย 60 เดือน × ปีราชการ" : "เงินเดือนเดือนสุดท้าย × ปีราชการ"}
              </p>
            </motion.div>

            {/* Monthly Pension */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} />
                <h3 className="font-semibold">เงินบำนาญรายเดือน</h3>
              </div>
              <div className="text-center py-4">
                <AnimatedNumber
                  value={result.monthly}
                  decimals={2}
                  className="text-4xl md:text-5xl font-bold block thai-num"
                />
                <p className="text-emerald-100 mt-2">บาท / เดือน</p>
              </div>
              <p className="text-xs text-emerald-200 text-center mt-4 pt-4 border-t border-white/20">
                {formulaNote}
              </p>
            </motion.div>
          </div>

          {/* Livelihood Pension */}
          {livelihood && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card hover={false} elevation="e2">
                <div className="flex items-center gap-2 mb-4">
                  <Gift size={20} className="text-amber-500" />
                  <h3 className="font-semibold text-gray-900">บำเหน็จดำรงชีพ</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  รวม <span className="font-bold text-gray-900">{formatNumber(livelihood.total, 2)}</span> บาท
                  (บำนาญรายเดือน × 15) แบ่งจ่าย 3 ครั้ง:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {livelihood.rounds.map((r) => (
                    <div
                      key={r.round}
                      className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-4 text-center"
                    >
                      <p className="text-xs font-medium text-amber-600 mb-2">{r.label}</p>
                      <p className="text-2xl font-bold text-amber-700">{formatNumber(r.amount, 2)}</p>
                      <p className="text-xs text-amber-500 mt-1">บาท</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </>
      ) : (
        <Card hover={false} elevation="e1">
          <p className="text-center text-gray-500 py-8">
            กรุณากรอกข้อมูลในขั้นตอนก่อนหน้าให้ครบเพื่อดูผลคำนวณ
          </p>
        </Card>
      )}

      {/* Salary Summary */}
      {salaryRecords.length > 0 && (() => {
        // Filter out the synthetic exit-marker row from stats — it doesn't
        // represent an actual salary round, only the day-before-exit display.
        const realRecords = salaryRecords.filter((r) => !r.isExitMarker);
        const lastRow = realRecords[realRecords.length - 1] ?? null;
        // GFP uses weighted-by-monthsInWindow average to match the formula
        // (handles partial boundary rows correctly). Non-GFP doesn't use this
        // stat. Falls back to a naive mean when monthsInWindow is unavailable
        // (shouldn't happen, but defensive).
        const totalMonthsInWindow = realRecords.reduce(
          (s, r) => s + r.monthsInWindow,
          0,
        );
        const sumWeighted = realRecords.reduce(
          (s, r) => s + r.newSalary * r.monthsInWindow,
          0,
        );
        const avg60 =
          totalMonthsInWindow > 0
            ? sumWeighted / totalMonthsInWindow
            : realRecords.reduce((s, r) => s + r.newSalary, 0) /
              (realRecords.length || 1);
        return (
          <Card hover={false} elevation="e2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-violet-500" />
              <h3 className="font-semibold text-gray-900">สรุปเงินเดือน</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">จำนวนรอบ</p>
                <p className="font-bold text-gray-900">{realRecords.length} รอบ</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">เงินเดือนเริ่มต้น</p>
                <p className="font-bold text-gray-900">
                  {formatNumber(realRecords[0]?.oldSalary || 0)}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">เงินเดือนสุดท้าย</p>
                <p className="font-bold text-gray-900">
                  {formatNumber(lastRow?.newSalary || 0)}
                </p>
              </div>
              {mode === "gfp" && (
                <div className="p-3 bg-violet-50 rounded-xl">
                  <p className="text-xs text-violet-600 mb-1">เงินเฉลี่ย 60 เดือน</p>
                  <p className="font-bold text-violet-700">
                    {formatNumber(avg60)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        );
      })()}

      {/* Compare: Lump-Sum vs Monthly Pension — eligibility & benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card hover={false} elevation="e2">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={20} className="text-violet-500" />
            <div>
              <h3 className="font-semibold text-gray-900">เลือกรับเงินแบบไหนดี?</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                เปรียบเทียบสิทธิประโยชน์ บำเหน็จ (เงินก้อน) vs บำนาญ (รายเดือน)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lump-sum column */}
            <div className="rounded-xl border-2 border-blue-100 bg-blue-50/30 p-4">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-blue-100">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Wallet size={18} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">กรณีเลือกรับบำเหน็จ</p>
                  <p className="text-xs text-blue-600">เงินก้อนครั้งเดียว</p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-emerald-600" strokeWidth={3} />
                  </span>
                  <span className="text-gray-700 leading-snug">
                    ได้รับเงินก้อนครั้งเดียว พร้อมเงินจาก กบข. สำหรับผู้เป็นสมาชิก
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <X size={12} className="text-red-600" strokeWidth={3} />
                  </span>
                  <span className="text-gray-600 leading-snug">
                    ไม่มีสิทธิเบิกค่ารักษาพยาบาลของตนเอง คู่สมรส บุตร และบิดามารดา
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <X size={12} className="text-red-600" strokeWidth={3} />
                  </span>
                  <span className="text-gray-600 leading-snug">
                    ไม่มีสิทธิได้รับเงินบำเหน็จดำรงชีพ
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <X size={12} className="text-red-600" strokeWidth={3} />
                  </span>
                  <span className="text-gray-600 leading-snug">
                    ไม่มีสิทธิได้รับเงินบำเหน็จตกทอด (30 เท่าของบำนาญ)
                  </span>
                </li>
              </ul>
            </div>

            {/* Monthly pension column */}
            <div className="rounded-xl border-2 border-emerald-100 bg-emerald-50/30 p-4">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-emerald-100">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">กรณีเลือกรับบำนาญ</p>
                  <p className="text-xs text-emerald-600">รายเดือนตลอดชีวิต</p>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-emerald-600" strokeWidth={3} />
                  </span>
                  <span className="text-gray-700 leading-snug">
                    ได้รับบำนาญเป็นรายเดือน พร้อมเงินจาก กบข. สำหรับผู้เป็นสมาชิก
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-emerald-600" strokeWidth={3} />
                  </span>
                  <span className="text-gray-700 leading-snug">
                    มีสิทธิเบิกค่ารักษาพยาบาลของตนเอง คู่สมรส บุตร และบิดามารดา
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-emerald-600" strokeWidth={3} />
                  </span>
                  <span className="text-gray-700 leading-snug">
                    มีสิทธิได้รับเงินบำเหน็จดำรงชีพ
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-emerald-600" strokeWidth={3} />
                  </span>
                  <span className="text-gray-700 leading-snug">
                    มีสิทธิได้รับเงินบำเหน็จตกทอด (30 เท่าของบำนาญ)
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footnote about inheritance deduction rule */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-2 text-xs text-gray-500 italic leading-relaxed">
            <Info size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
            <p>
              <span className="font-medium text-gray-600 not-italic">หมายเหตุ:</span>{" "}
              การคำนวณเงินบำเหน็จตกทอดที่ทายาทมีสิทธิได้รับ
              หากผู้รับบำนาญได้รับเงินบำเหน็จดำรงชีพไปแล้ว
              ให้นำเงินบำเหน็จดำรงชีพที่ได้รับไปแล้วมาหักออกก่อน
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Info size={20} className="text-amber-600" />
        </div>
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">หมายเหตุสำคัญ</p>
          <p className="leading-relaxed">
            ผลการคำนวณข้างต้นเป็น <span className="font-semibold">ประมาณการเบื้องต้น</span> เท่านั้น
            โปรดตรวจสอบกับกองบริหารทรัพยากรบุคคล สำนักงานปลัดกระทรวงยุติธรรม
            อีกครั้งก่อนตัดสินใจทางการเงิน
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-4">
        <Button variant="outline" onClick={onBack} icon={<ChevronLeft size={18} />} iconPosition="left">
          กลับไปแก้ไข
        </Button>
        <Button variant="secondary" onClick={handlePrint} icon={<Printer size={18} />} iconPosition="left">
          พิมพ์ / บันทึก PDF
        </Button>
      </div>

      <SocialShare />
    </motion.div>
  );
}
