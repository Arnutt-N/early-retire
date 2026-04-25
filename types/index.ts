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

export interface SalaryOverride {
  /** ISO date string of the salary effective date for this row, or null to use computed default */
  effectiveDate: string | null;
  /** Override level for this row (must match a `level` in salary-bases.json), or null to use form default */
  level: string | null;
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
  level: string;
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

  // Step 3-4 — new (redesign)
  mode: "gfp" | "non-gfp" | null;
  salaryOverrides: SalaryOverride[];

  // Step 3-4 — legacy (deprecated, removed in Phase 4)
  /** @deprecated since Phase 1 — removed in Phase 4. Position dropdown is dropped (req #2). */
  position?: string;
  /** @deprecated since Phase 1 — removed in Phase 4. Level category radio is dropped. */
  levelCategory?: string;
  currentSalary: number;
  latestAssessmentDate: string | null;
  assessmentIncreases: number[];

  // View state — legacy (deprecated, removed in Phase 4)
  /** @deprecated since Phase 1 — removed in Phase 4. Use `mode` (top-level) instead. */
  viewMode?: "non-gfp" | "gfp";

  // Migration
  /** Schema version of this saved state. Bump on breaking shape changes; Phase 4 silent-clears localStorage on mismatch. */
  __schemaVersion: number;
}

export type RetirementOption = FormState["retirementOption"];

/** Current schema version for FormState. Bump when shape changes incompatibly. Phase 1 sets this to 2 (v1 = pre-redesign). */
export const FORM_STATE_SCHEMA_VERSION = 2;
