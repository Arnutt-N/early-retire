import { roundUp10, toBE } from "./utils";

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

export function calculateRetirementDate(birthDate: Date): Date {
  let retireYear = birthDate.getFullYear() + 60;
  const birthMonth = birthDate.getMonth();
  const birthDay = birthDate.getDate();

  // If born on or after Oct 1, add 1 year
  if (birthMonth >= 9) {
    retireYear += 1;
  }

  return new Date(retireYear, birthMonth, birthDay);
}

export function calculateServicePeriod(start: Date, end: Date): ServicePeriod {
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

  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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
}

export function generateSalaryTable(
  currentSalary: number,
  level: string,
  assessmentDate: Date,
  increases: number[],
  endDate: Date,
  mode: "non-gfp" | "gfp",
  salaryBases: Array<{
    level: string;
    fullSalary: number;
    baseTop: number;
    baseBottom: number;
    baseMid: number;
  }>
): SalaryRecord[] {
  const records: SalaryRecord[] = [];
  const baseInfo = salaryBases.find((b) => b.level === level);
  if (!baseInfo) return records;

  const avgPercent =
    increases.length > 0
      ? increases.reduce((a, b) => a + b, 0) / increases.length
      : 3.5;

  let salary = currentSalary;
  let currentDate = new Date(assessmentDate);
  const isGfp = mode === "gfp";
  const targetDate = new Date(endDate);

  // For GFP: need 60 months back from end date
  // For non-GFP: from assessment date to end date
  if (isGfp) {
    const monthsBack = 60;
    currentDate = new Date(targetDate);
    currentDate.setMonth(currentDate.getMonth() - monthsBack);
  }

  let periodCount = 0;
  const maxPeriods = isGfp ? 60 : 100;

  while (currentDate <= targetDate && periodCount < maxPeriods) {
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + 6);

    const percent = periodCount < increases.length ? increases[periodCount] : avgPercent;
    const useBase =
      salary <= baseInfo.baseMid ? baseInfo.baseBottom : baseInfo.baseTop;
    const rawIncrease = useBase * (percent / 100);
    const actualIncrease = roundUp10(rawIncrease);
    const newSalary = salary + actualIncrease;

    const isCurrent = periodCount === 0;
    const isEstimated = periodCount >= increases.length;

    records.push({
      period: currentDate.toISOString(),
      periodLabel: `${currentDate.getDate().toString().padStart(2, "0")}/${(
        currentDate.getMonth() + 1
      ).toString().padStart(2, "0")}/${toBE(currentDate.getFullYear())}`,
      level,
      oldSalary: salary,
      maxSalary: baseInfo.fullSalary,
      base: useBase,
      percent,
      increase: Math.round(rawIncrease * 100) / 100,
      actualIncrease,
      newSalary: newSalary > baseInfo.fullSalary ? baseInfo.fullSalary : newSalary,
      isEstimated,
      isCurrent,
    });

    salary = newSalary > baseInfo.fullSalary ? baseInfo.fullSalary : newSalary;
    currentDate = nextDate;
    periodCount++;

    if (isGfp && records.length >= 10) break; // ~60 months = ~10 periods
  }

  return records;
}
