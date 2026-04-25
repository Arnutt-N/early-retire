"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";
import Footer from "@/components/Footer";
import ModeSelect from "./sections/ModeSelect";
import PersonalInfoForm from "./sections/PersonalInfoForm";
import ServicePeriodForm from "./sections/ServicePeriodForm";
import SalaryHistoryForm from "./sections/SalaryHistoryForm";
import SalaryTableSection from "./sections/SalaryTable";
import ResultSection from "./sections/ResultSection";
import { FormState, FORM_STATE_SCHEMA_VERSION } from "@/types";
import {
  calculateServicePeriod,
  calculatePensionNonGfp,
  calculatePensionGfp,
  calculateLivelihood,
  generateSalaryTable,
  type SalaryBaseInfo,
} from "@/lib/calculations";
import salaryBasesData from "@/data/salary-bases.json";

const salaryBases = salaryBasesData as SalaryBaseInfo[];

const STORAGE_KEY = "early-retire-form";

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
  mode: null,
  salaryOverrides: [],
  defaultLevel: "ปฏิบัติงาน",
  position: "",
  levelCategory: "general",
  currentSalary: 0,
  latestAssessmentDate: null,
  assessmentIncreases: [0, 0, 0, 0, 0, 0],
  viewMode: "non-gfp",
  __schemaVersion: FORM_STATE_SCHEMA_VERSION,
};

function loadInitialForm(): FormState {
  if (typeof window === "undefined") return initialForm;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialForm;
    const parsed = JSON.parse(saved) as Partial<FormState>;
    // Schema mismatch → silent clear
    if (parsed.__schemaVersion !== FORM_STATE_SCHEMA_VERSION) {
      window.localStorage.removeItem(STORAGE_KEY);
      return initialForm;
    }
    return { ...initialForm, ...parsed };
  } catch {
    return initialForm;
  }
}

export default function Home() {
  const [form, setForm] = useState<FormState>(loadInitialForm);
  const [step, setStep] = useState(0);

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => {
      const next: FormState = {
        ...prev,
        ...updates,
        __schemaVersion: FORM_STATE_SCHEMA_VERSION,
      };
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      } catch {
        // ignore quota errors
      }
      return next;
    });
  };

  const totalLeaveDays =
    (form.sickLeaveDays || 0) +
    (form.personalLeaveDays || 0) +
    (form.vacationDays || 0);

  const servicePeriod = useMemo(() => {
    if (!form.startDate || !form.endDate) return null;
    return calculateServicePeriod(
      new Date(form.startDate),
      new Date(form.endDate),
      totalLeaveDays,
    );
  }, [form.startDate, form.endDate, totalLeaveDays]);

  const totalServiceYears = servicePeriod?.totalYears ?? 0;

  const salaryRecords = useMemo(() => {
    if (!form.currentSalary || !form.endDate || !form.mode) return [];
    const endDate = new Date(form.endDate);
    const assessmentDate = form.latestAssessmentDate
      ? new Date(form.latestAssessmentDate)
      : new Date(endDate.getFullYear(), endDate.getMonth() - 6, 1);

    return generateSalaryTable(
      form.currentSalary,
      form.defaultLevel,
      assessmentDate,
      form.assessmentIncreases,
      endDate,
      form.mode,
      salaryBases,
      form.salaryOverrides,
    );
  }, [
    form.currentSalary,
    form.endDate,
    form.latestAssessmentDate,
    form.mode,
    form.defaultLevel,
    form.assessmentIncreases,
    form.salaryOverrides,
  ]);

  const lastSalary = useMemo(() => {
    if (salaryRecords.length === 0) return form.currentSalary;
    return salaryRecords[salaryRecords.length - 1].newSalary;
  }, [salaryRecords, form.currentSalary]);

  const avg60Months = useMemo(() => {
    if (salaryRecords.length === 0) return 0;
    const total = salaryRecords.reduce((s, r) => s + r.newSalary, 0);
    return total / salaryRecords.length;
  }, [salaryRecords]);

  const result = useMemo(() => {
    if (!form.mode || totalServiceYears <= 0) return null;
    if (form.mode === "non-gfp") {
      return calculatePensionNonGfp(lastSalary, totalServiceYears);
    }
    return calculatePensionGfp(avg60Months, totalServiceYears);
  }, [form.mode, lastSalary, avg60Months, totalServiceYears]);

  const livelihood = useMemo(() => {
    if (!result || !form.mode) return null;
    return calculateLivelihood(result.monthly, form.mode);
  }, [result, form.mode]);

  const goNext = () => setStep((s) => Math.min(s + 1, 5));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const steps = [
    <ModeSelect key="0" form={form} updateForm={updateForm} onNext={goNext} />,
    <PersonalInfoForm
      key="1"
      form={form}
      updateForm={updateForm}
      onNext={goNext}
    />,
    <ServicePeriodForm
      key="2"
      form={form}
      updateForm={updateForm}
      onNext={goNext}
      onBack={goBack}
    />,
    <SalaryHistoryForm
      key="3"
      form={form}
      updateForm={updateForm}
      onNext={goNext}
      onBack={goBack}
    />,
    <SalaryTableSection
      key="4"
      form={form}
      updateForm={updateForm}
      records={salaryRecords}
      salaryBases={salaryBases}
      onNext={goNext}
      onBack={goBack}
    />,
    <ResultSection
      key="5"
      mode={form.mode}
      birthDate={form.birthDate}
      startDate={form.startDate}
      endDate={form.endDate}
      servicePeriod={servicePeriod}
      result={result}
      livelihood={livelihood}
      salaryRecords={salaryRecords}
      onBack={goBack}
    />,
  ];

  return (
    <main className="min-h-screen flex flex-col bg-[var(--background)]">
      <header className="bg-[image:var(--gradient-mesh-primary)] text-white py-6 shadow-[var(--shadow-e2)]">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold">คำนวณบำเหน็จบำนาญ</h1>
          <p className="text-blue-100 mt-1 text-sm md:text-base">
            กองบริหารทรัพยากรบุคคล สำนักงานปลัดกระทรวงยุติธรรม
          </p>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-[var(--shadow-e1)]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <ProgressBar currentStep={step} />
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}
