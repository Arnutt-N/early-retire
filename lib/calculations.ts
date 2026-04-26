import { roundUp10, toBE, getMostRecentRound } from "./utils";

export interface ServicePeriod {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalYears: number;
}

export interface PensionResult {
  monthly: number;
  lumpSum: number;
  yearly: number;
}

export interface LivelihoodRound {
  round: number;
  age: number;
  amount: number;
  label: string;
}

export interface LivelihoodResult {
  total: number;
  rounds: LivelihoodRound[];
}

/**
 * Salary base info for one level (mirror of salary-bases.json row, partial fields used by helpers).
 * Source of truth: data/salary-bases.json
 */
export interface SalaryBaseInfo {
  level: string;
  fullSalary: number;
  baseTop: number;
  baseBottom: number;
  baseMid: number;
}

/** Per-row override for the salary calculation table (Phase 3+). */
export interface SalaryOverride {
  effectiveDate: string | null;
  level: string | null;
  percent: number | null;
}

/**
 * Look up the salary-base record for a given level. Returns `null` if not found
 * (e.g. legacy levels with `*` suffix from position-map.json).
 */
export function getSalaryBaseForLevel(
  level: string,
  salaryBases: SalaryBaseInfo[],
): SalaryBaseInfo | null {
  return salaryBases.find((b) => b.level === level) ?? null;
}

/**
 * Pick the calculation base for a salary: baseBottom if salary <= baseMid,
 * otherwise baseTop. Returns 0 if `baseInfo` is null (caller should guard upstream).
 */
export function selectBaseForSalary(
  salary: number,
  baseInfo: SalaryBaseInfo | null,
): number {
  if (!baseInfo) return 0;
  return salary <= baseInfo.baseMid ? baseInfo.baseBottom : baseInfo.baseTop;
}

export function calculateRetirementDate(birthDate: Date): Date {
  let retireYear = birthDate.getFullYear() + 60;
  const birthMonth = birthDate.getMonth();

  // If born on or after Oct 1 (Thai fiscal-year cutoff), retire one year later.
  // Retirement always lands on 1 October of the qualifying fiscal year.
  if (birthMonth >= 9) {
    retireYear += 1;
  }

  return new Date(retireYear, 9, 1); // month index 9 = October
}

export function calculateServicePeriod(
  start: Date,
  end: Date,
  leaveDays: number = 0,
): ServicePeriod {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const rawTotalDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const safeLeave = Math.max(0, Math.floor(Number.isFinite(leaveDays) ? leaveDays : 0));
  const totalDays = Math.max(0, rawTotalDays - safeLeave);
  const totalYears = totalDays / 365.25;

  return { years, months, days, totalDays, totalYears };
}

export function calculatePensionNonGfp(lastSalary: number, serviceYears: number): PensionResult {
  const monthly = (lastSalary * serviceYears) / 50;
  const lumpSum = lastSalary * serviceYears;
  return {
    monthly: Math.round(monthly * 100) / 100,
    lumpSum: Math.round(lumpSum * 100) / 100,
    yearly: Math.round(monthly * 12 * 100) / 100,
  };
}

export function calculatePensionGfp(avg60Months: number, serviceYears: number): PensionResult {
  const formula1 = (avg60Months * serviceYears) / 50;
  const formula2 = avg60Months * 0.7;
  const monthly = Math.min(formula1, formula2);
  const lumpSum = avg60Months * serviceYears;
  return {
    monthly: Math.round(monthly * 100) / 100,
    lumpSum: Math.round(lumpSum * 100) / 100,
    yearly: Math.round(monthly * 12 * 100) / 100,
  };
}

export function calculateLivelihood(
  monthlyPension: number,
  mode: "non-gfp" | "gfp"
): LivelihoodResult {
  const total = monthlyPension * 15;
  const rounds: LivelihoodRound[] = [];

  const schedule =
    mode === "non-gfp"
      ? [
          { age: 60, max: 200000 },
          { age: 65, max: 200000 },
          { age: 70, max: null as number | null },
        ]
      : [
          { age: 60, max: 200000 },
          { age: 65, max: 200000 },
          { age: 70, max: 100000 },
        ];

  let remaining = total;
  schedule.forEach((s, i) => {
    const roundNum = i + 1;
    let amount = remaining;
    if (s.max !== null) {
      amount = Math.min(amount, s.max);
    }
    if (amount < 0) amount = 0;
    rounds.push({
      round: roundNum,
      age: s.age,
      amount: Math.round(amount * 100) / 100,
      label:
        roundNum === 1
          ? "เมื่อเกษียณ/ลาออก"
          : roundNum === 2
          ? "อายุครบ 65 ปี"
          : "อายุครบ 70 ปี",
    });
    remaining -= amount;
  });

  return {
    total: Math.round(total * 100) / 100,
    rounds,
  };
}

export interface SalaryRecord {
  period: string;
  periodLabel: string;
  level: string;
  oldSalary: number;
  maxSalary: number;
  base: number;
  percent: number;
  increase: number;
  actualIncrease: number;
  newSalary: number;
  isEstimated: boolean;
  isCurrent: boolean;
  /**
   * Months this row contributes to the 60-month averaging window for GFP.
   * 6 = full fiscal round inside window. 1-5 = partial boundary row (e.g.
   * resignation on a non-fiscal date). 0 = row is outside window (still shown
   * for historical edit context, but not counted in the average).
   */
  monthsInWindow: number;
}

/**
 * Inclusive month count between two dates, rounded to nearest whole month.
 * Uses average month length (30.4375 days) — accurate for our day-aligned
 * fiscal-round boundaries (1 Apr / 1 Oct → 6 months) and partial spans
 * caused by non-fiscal exit dates (e.g. 1/6 - 30/9 → 4 months).
 */
function monthsInRange(start: Date, end: Date): number {
  if (end.getTime() < start.getTime()) return 0;
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
  return Math.round(days / 30.4375);
}

export function generateSalaryTable(
  currentSalary: number,
  level: string,
  assessmentDate: Date,
  increases: number[],
  endDate: Date,
  mode: "non-gfp" | "gfp",
  salaryBases: SalaryBaseInfo[],
  overrides: SalaryOverride[] = [],
): SalaryRecord[] {
  const records: SalaryRecord[] = [];
  const defaultBaseInfo = getSalaryBaseForLevel(level, salaryBases);
  if (!defaultBaseInfo) return records;

  const avgPercent =
    increases.length > 0
      ? increases.reduce((a, b) => a + b, 0) / increases.length
      : 3.5;

  // Anchor: day BEFORE retirement (per improve-flow-logic.txt #8)
  const lastDay = new Date(endDate);
  lastDay.setDate(lastDay.getDate() - 1);
  const anchorRound = getMostRecentRound(lastDay);

  // Snap latestAssessmentDate UP to the next round boundary on/after it.
  // Used by both GFP and non-GFP branches.
  let snappedAssessment = getMostRecentRound(assessmentDate);
  if (snappedAssessment.getTime() < assessmentDate.getTime()) {
    snappedAssessment = new Date(snappedAssessment);
    snappedAssessment.setMonth(snappedAssessment.getMonth() + 6);
  }

  // Determine the FIRST round date in the table (oldest):
  // - GFP: window = [ MIN(getMostRecentRound(endDate − 60 mo), snappedAssessment), anchor ]
  //        → calendar-precise 60-month cutoff: take endDate − 60 months
  //          (e.g. exit 1/6/2570 → cutoff 1/6/2565), then snap DOWN to the
  //          fiscal boundary at-or-before that date (e.g. 1/4/2565). This
  //          captures partial first-round months when exit isn't on 1 Oct/1 Apr.
  //        → if assessmentDate is OLDER than the cutoff, extend window back
  //          to assessmentDate so the user can edit older historical %.
  //        → if assessmentDate is RECENT (newer than cutoff), bound window to
  //          the fiscal round containing the cutoff.
  // - non-GFP: window = [ snappedAssessment, anchor ]
  let firstRound: Date;
  if (mode === "gfp") {
    const sixtyMonthsBackCalendar = new Date(endDate);
    sixtyMonthsBackCalendar.setMonth(sixtyMonthsBackCalendar.getMonth() - 60);
    const sixtyMonthsBackFiscal = getMostRecentRound(sixtyMonthsBackCalendar);
    const startMs = Math.min(
      sixtyMonthsBackFiscal.getTime(),
      snappedAssessment.getTime(),
    );
    firstRound = new Date(startMs);
    // Safety: if the assessment date itself is past the anchor (shouldn't happen
    // in practice but guard anyway), collapse to a single row at anchor.
    if (firstRound.getTime() > anchorRound.getTime()) {
      firstRound = new Date(anchorRound);
    }
  } else {
    // non-GPF: latest assessment date → anchorRound
    let snapped = snappedAssessment;
    if (snapped.getTime() > anchorRound.getTime()) {
      // assessment date is past the last round — single row at anchor
      snapped = new Date(anchorRound);
    }
    firstRound = snapped;
  }

  let salary = currentSalary;
  let cursor = new Date(firstRound);
  let periodCount = 0;
  const safety = 200; // hard cap to prevent runaway loops

  while (cursor.getTime() <= anchorRound.getTime() && periodCount < safety) {
    const override = overrides[periodCount];

    // Per-row level override falls back to default
    const rowLevel = override?.level ?? level;
    const rowBaseInfo =
      rowLevel === level
        ? defaultBaseInfo
        : (getSalaryBaseForLevel(rowLevel, salaryBases) ?? defaultBaseInfo);

    // Per-row effective-date override jumps the cursor for this row only
    const rowDate = override?.effectiveDate ? new Date(override.effectiveDate) : cursor;

    const computedPercent =
      periodCount < increases.length ? increases[periodCount] : avgPercent;
    const percent = override?.percent ?? computedPercent;
    const useBase = selectBaseForSalary(salary, rowBaseInfo);
    const rawIncrease = useBase * (percent / 100);
    const actualIncrease = roundUp10(rawIncrease);
    const newSalary = salary + actualIncrease;
    const cappedNewSalary =
      newSalary > rowBaseInfo.fullSalary ? rowBaseInfo.fullSalary : newSalary;

    const isCurrent = periodCount === 0;
    const isEstimated = periodCount >= increases.length;

    records.push({
      period: rowDate.toISOString(),
      periodLabel: `${rowDate.getDate().toString().padStart(2, "0")}/${(
        rowDate.getMonth() + 1
      ).toString().padStart(2, "0")}/${toBE(rowDate.getFullYear())}`,
      level: rowLevel,
      oldSalary: salary,
      maxSalary: rowBaseInfo.fullSalary,
      base: useBase,
      percent,
      increase: Math.round(rawIncrease * 100) / 100,
      actualIncrease,
      newSalary: cappedNewSalary,
      isEstimated,
      isCurrent,
      monthsInWindow: 0, // computed in post-pass below
    });

    salary = cappedNewSalary;
    cursor = new Date(cursor);
    cursor.setMonth(cursor.getMonth() + 6);
    periodCount++;
  }

  // Post-pass: compute monthsInWindow per row based on overlap with the
  // 60-month averaging window [endDate − 60 mo, endDate − 1 day].
  // Each row's "fiscal period" = [period, nextRow.period − 1 day] (or
  // [period, endDate − 1 day] for the last row).
  const windowEnd = new Date(endDate);
  windowEnd.setDate(windowEnd.getDate() - 1);
  const windowStart = new Date(endDate);
  windowStart.setMonth(windowStart.getMonth() - 60);

  return records.map((r, idx) => {
    const rowStart = new Date(r.period);
    let rowEnd: Date;
    if (idx < records.length - 1) {
      rowEnd = new Date(records[idx + 1].period);
      rowEnd.setDate(rowEnd.getDate() - 1);
    } else {
      // Last row: extends to the day before exit
      rowEnd = new Date(windowEnd);
    }

    const overlapStart =
      rowStart.getTime() > windowStart.getTime() ? rowStart : windowStart;
    const overlapEnd =
      rowEnd.getTime() < windowEnd.getTime() ? rowEnd : windowEnd;

    const monthsInWindow =
      overlapStart.getTime() <= overlapEnd.getTime()
        ? monthsInRange(overlapStart, overlapEnd)
        : 0;

    return { ...r, monthsInWindow };
  });
}
