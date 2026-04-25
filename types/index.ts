export interface ServicePeriod {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalYears: number;
}

export interface MultiplierPeriod {
  id?: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  multiplier: number;
  label?: string;
}

export interface PensionResult {
  monthly: number;
  lumpSum: number;
  cap: number;
  capReached: boolean;
  yearly: number;
}

export interface LivelihoodRound {
  age: number;
  amount: number;
  label: string;
}

export interface LivelihoodResult {
  total: number;
  rounds: LivelihoodRound[];
}

export interface SalaryRecord {
  period: string; // ISO date
  periodLabel: string;
  level: number;
  oldSalary: number;
  maxSalary: number;
  base: number;
  percent: number;
  increase: number;
  newSalary: number;
  isEstimated: boolean;
  isCurrent: boolean;
}

export interface FormState {
  // Step 1
  birthDate: string | null;
  startDate: string | null;
  endDate: string | null;
  retirementOption: "age60" | "service25" | "custom";

  // Step 2
  multiplierPeriods: MultiplierPeriod[];
  sickLeaveDays: number;
  personalLeaveDays: number;
  vacationDays: number;

  // Step 3-4
  position: string;
  levelCategory: string;
  currentSalary: number;
  latestAssessmentDate: string | null;
  assessmentIncreases: number[];

  // View state
  viewMode: "non-gfp" | "gfp";
}

export type RetirementOption = FormState["retirementOption"];
