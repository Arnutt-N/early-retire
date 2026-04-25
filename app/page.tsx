"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";
import Footer from "@/components/Footer";
import PersonalInfoForm from "./sections/PersonalInfoForm";
import ServicePeriodForm from "./sections/ServicePeriodForm";
import SalaryHistoryForm from "./sections/SalaryHistoryForm";
import SalaryTableSection from "./sections/SalaryTable";
import ResultSection from "./sections/ResultSection";
import { FormState } from "@/types";
import {
  calculateServicePeriod,
  calculatePensionNonGfp,
  calculatePensionGfp,
  calculateLivelihood,
  generateSalaryTable,
} from "@/lib/calculations";
import salaryBases from "@/data/salary-bases.json";
import positionMap from "@/data/position-map.json";

const initialForm: FormState = {
  birthDate: null,
  startDate: null,
  endDate: null,
  retirementOption: "age60",
  multiplierPeriods: [
    {
      id: "default-1",
      startDate: "1976-10-07",
      endDate: "1977-01-05",
      multiplier: 1,
      label: "ปี 19 (7 ต.ค. 2519 - 5 ม.ค. 2520)",
    },
    {
      id: "default-2",
      startDate: "1991-02-23",
      endDate: "1991-05-02",
      multiplier: 1,
      label: "ปี 34 (23 ก.พ. 2534 - 2 พ.ค. 2534)",
    },
  ],
  sickLeaveDays: 0,
  personalLeaveDays: 0,
  vacationDays: 0,
  position: "",
  levelCategory: "general",
  currentSalary: 0,
  latestAssessmentDate: null,
  assessmentIncreases: [0, 0, 0, 0, 0, 0],
  viewMode: "non-gfp",
  // Phase 1 additions — Phase 4 will own page.tsx fully
  mode: null,
  salaryOverrides: [],
  __schemaVersion: 2,
};

export default function Home() {
  const [form, setForm] = useState<FormState>(() => {
    if (typeof window === "undefined") return initialForm;
    try {
      const saved = localStorage.getItem("early-retire-form");
      return saved ? { ...initialForm, ...JSON.parse(saved) } : initialForm;
    } catch {
      return initialForm;
    }
  });
  const [step, setStep] = useState(0);

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem("early-retire-form", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const servicePeriod = useMemo(() => {
    if (!form.startDate || !form.endDate) return null;
    return calculateServicePeriod(new Date(form.startDate), new Date(form.endDate));
  }, [form.startDate, form.endDate]);

  const totalServiceYears = useMemo(() => {
    if (!servicePeriod) return 0;
    return servicePeriod.totalYears;
  }, [servicePeriod]);

  const salaryRecords = useMemo(() => {
    if (!form.position || !form.currentSalary || !form.endDate) return [];
    const pos = positionMap[form.position as keyof typeof positionMap];
    if (!pos) return [];
    const level =
      (pos as Record<string, string>)[form.levelCategory ?? "general"] ||
      Object.values(pos)[0];
    const endDate = new Date(form.endDate);
    const assessmentDate = form.latestAssessmentDate
      ? new Date(form.latestAssessmentDate)
      : new Date(endDate.getFullYear(), endDate.getMonth() - 6, 1);

    return generateSalaryTable(
      form.currentSalary,
      level,
      assessmentDate,
      form.assessmentIncreases,
      endDate,
      form.viewMode ?? "non-gfp",
      salaryBases as Array<{
        level: string;
        fullSalary: number;
        baseTop: number;
        baseBottom: number;
        baseMid: number;
      }>
    );
  }, [form]);

  const lastSalary = useMemo(() => {
    if (salaryRecords.length === 0) return form.currentSalary;
    return salaryRecords[salaryRecords.length - 1].newSalary;
  }, [salaryRecords, form.currentSalary]);

  const avg60Months = useMemo(() => {
    if (salaryRecords.length === 0) return 0;
    const total = salaryRecords.reduce((s, r) => s + r.newSalary, 0);
    return total / salaryRecords.length;
  }, [salaryRecords]);

  const nonGfpResult = useMemo(() => {
    if (totalServiceYears <= 0) return null;
    return calculatePensionNonGfp(lastSalary, totalServiceYears);
  }, [lastSalary, totalServiceYears]);

  const gfpResult = useMemo(() => {
    if (totalServiceYears <= 0) return null;
    return calculatePensionGfp(avg60Months, totalServiceYears);
  }, [avg60Months, totalServiceYears]);

  const nonGfpLivelihood = useMemo(() => {
    if (!nonGfpResult) return null;
    return calculateLivelihood(nonGfpResult.monthly, "non-gfp");
  }, [nonGfpResult]);

  const gfpLivelihood = useMemo(() => {
    if (!gfpResult) return null;
    return calculateLivelihood(gfpResult.monthly, "gfp");
  }, [gfpResult]);

  const steps = [
    <PersonalInfoForm key="1" form={form} updateForm={updateForm} onNext={() => setStep(1)} />,
    <ServicePeriodForm
      key="2"
      form={form}
      updateForm={updateForm}
      onNext={() => setStep(2)}
      onBack={() => setStep(0)}
    />,
    <SalaryHistoryForm
      key="3"
      form={form}
      updateForm={updateForm}
      onNext={() => setStep(3)}
      onBack={() => setStep(1)}
    />,
    <SalaryTableSection
      key="4"
      records={salaryRecords}
      onNext={() => setStep(4)}
      onBack={() => setStep(2)}
    />,
    <ResultSection
      key="5"
      birthDate={form.birthDate}
      startDate={form.startDate}
      endDate={form.endDate}
      servicePeriod={servicePeriod}
      nonGfpResult={nonGfpResult}
      gfpResult={gfpResult}
      nonGfpLivelihood={nonGfpLivelihood}
      gfpLivelihood={gfpLivelihood}
      salaryRecords={salaryRecords}
      onBack={() => setStep(3)}
    />,
  ];

  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="bg-[var(--primary)] text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">คำนวณบำเหน็จบำนาญ</h1>
          <p className="text-blue-100 mt-1 text-sm md:text-base">
            กองบริหารทรัพยากรบุคคล สำนักงานปลัดกระทรวงยุติธรรม
          </p>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ProgressBar currentStep={step} />
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}
