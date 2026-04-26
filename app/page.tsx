"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProgressBar from "@/components/ProgressBar";
import Footer from "@/components/Footer";
import ConfirmModal from "@/components/ui/ConfirmModal";
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
import { Calculator, RotateCcw } from "lucide-react";

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
  const [resetOpen, setResetOpen] = useState(false);
  // Track which (birth|start|end) combination the user last dismissed the
  // eligibility warning for. If they edit dates back to ineligible the modal
  // resurfaces because the key changes.
  const [eligibilityAckedKey, setEligibilityAckedKey] = useState<string | null>(null);

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
    // Per Thai GFP rule: strict average of LAST 60 months (10 rounds × 6 mo) — even
    // when the displayed table extends further back to cover historical assessments.
    const last60 = salaryRecords.slice(-10);
    const total = last60.reduce((s, r) => s + r.newSalary, 0);
    return total / last60.length;
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

  // Eligibility check: Thai civil-servant pension rule = service ≥ 10 years
  // for any lump-sum/pension entitlement. Below that, only the personal GFP
  // balance is returned (for GFP members).
  const eligibilityKey = `${form.birthDate ?? ""}|${form.startDate ?? ""}|${form.endDate ?? ""}`;
  const eligibilityCheck = useMemo(() => {
    if (!form.birthDate || !form.startDate || !form.endDate) return null;
    const birth = new Date(form.birthDate);
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (
      isNaN(birth.getTime()) ||
      isNaN(start.getTime()) ||
      isNaN(end.getTime())
    ) {
      return null;
    }
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    const serviceYears = (end.getTime() - start.getTime()) / msPerYear;
    const ageAtRetirement = (end.getTime() - birth.getTime()) / msPerYear;
    return {
      serviceYears,
      ageAtRetirement,
      eligible: serviceYears >= 10,
    };
  }, [form.birthDate, form.startDate, form.endDate]);

  // Modal is gated on the step-1 → step-2 transition, NOT reactively on date
  // edits. Reason: showing it while the user is still typing the third date
  // (which would happen as soon as it parses) feels like a false positive
  // and was being interpreted as "system telling me to use the date picker."
  const [pendingEligibilityWarn, setPendingEligibilityWarn] = useState(false);
  const showEligibilityWarn = pendingEligibilityWarn;

  // Wrapper used by Step 1 (PersonalInfoForm) instead of plain goNext.
  // Validates eligibility before advancing; opens modal if invalid + not yet acked.
  const tryGoNextFromStep1 = () => {
    if (
      eligibilityCheck !== null &&
      !eligibilityCheck.eligible &&
      eligibilityAckedKey !== eligibilityKey
    ) {
      setPendingEligibilityWarn(true);
      return;
    }
    goNext();
  };

  const performReset = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const steps = [
    <ModeSelect key="0" form={form} updateForm={updateForm} onNext={goNext} />,
    <PersonalInfoForm
      key="1"
      form={form}
      updateForm={updateForm}
      onNext={tryGoNextFromStep1}
      onBack={goBack}
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
      {/* Minimal translucent navbar (sticky) */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Calculator size={18} className="text-white" />
            </div>
            <h1 className="text-base md:text-lg font-bold text-gray-900 truncate">
              คำนวณบำเหน็จบำนาญ
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            aria-label="เริ่มใหม่ — ล้างข้อมูลที่กรอกไว้"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors min-h-[40px] cursor-pointer"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">เริ่มใหม่</span>
          </button>
        </div>
      </header>

      {/* Progress Bar (own row, below navbar) */}
      <div className="bg-white border-b border-gray-100 mt-2 sm:mt-3">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:py-6">
          <ProgressBar currentStep={step} />
        </div>
      </div>

      {/* Main Content — widen for the salary calculation step so the desktop table has room */}
      <div
        className={`flex-1 mx-auto w-full px-4 py-8 ${
          step === 4 ? "max-w-6xl" : "max-w-4xl"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      <Footer />

      <ConfirmModal
        open={resetOpen}
        onConfirm={performReset}
        onCancel={() => setResetOpen(false)}
        title="ต้องการเริ่มใหม่?"
        description="ข้อมูลที่กรอกไว้ทั้งหมดจะถูกล้าง และไม่สามารถกู้คืนได้"
        confirmLabel="เริ่มใหม่"
        cancelLabel="ยกเลิก"
        variant="danger"
      />

      <ConfirmModal
        open={showEligibilityWarn}
        variant="info"
        title="ข้อมูลไม่เข้าเงื่อนไขการรับบำเหน็จ/บำนาญ"
        description={
          <>
            จากวันที่บรรจุและวันพ้นราชการที่กรอก คำนวณได้
            <span className="font-semibold text-gray-900">
              {" "}อายุราชการประมาณ {eligibilityCheck?.serviceYears.toFixed(1)} ปี
            </span>{" "}
            ซึ่งน้อยกว่า 10 ปี — ไม่เข้าเงื่อนไขการรับบำเหน็จหรือบำนาญข้าราชการ
            <br />
            <br />
            หากท่านเป็นสมาชิก กบข. จะยังคงมีสิทธิรับ
            <span className="font-semibold text-gray-900"> เงินสะสม กบข. </span>
            ที่สะสมไว้ตลอดอายุราชการ
            <br />
            <br />
            <span className="text-gray-500">
              โปรดตรวจสอบวันบรรจุและวันพ้นราชการอีกครั้ง หากข้อมูลถูกต้อง
              สามารถคลิก &quot;ดำเนินการต่อ&quot; เพื่อดูตัวเลขประมาณการได้
            </span>
          </>
        }
        confirmLabel="ดำเนินการต่อ"
        cancelLabel="กลับไปแก้ไข"
        onConfirm={() => {
          // User acknowledges and proceeds to step 2.
          setEligibilityAckedKey(eligibilityKey);
          setPendingEligibilityWarn(false);
          goNext();
        }}
        onCancel={() => {
          // User wants to fix the dates — close modal, stay on step 1.
          setPendingEligibilityWarn(false);
        }}
      />
    </main>
  );
}
