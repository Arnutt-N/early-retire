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
  /** Override row's oldSalary (pre-raise salary). null = computed default. */
  oldSalary: number | null;
  /** Override row's newSalary (post-raise salary). null = computed default. */
  newSalary: number | null;
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
  // Service-years formula per Thai civil-service convention (used in HR/pension
  // documents and Excel templates): Y + M/12 + D/365, then subtract leave days
  // as a fraction of 365. Months are treated as exactly 1/12 of a year and
  // days as 1/365 — NOT calendar-precise (which would use 365.25 and real
  // month lengths). The official-doc convention takes precedence so users
  // can reconcile the calculator output against their own paperwork.
  const totalYears = Math.max(
    0,
    years + months / 12 + days / 365 - safeLeave / 365,
  );

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

export function calculatePensionGfp(
  avg60Months: number,
  lastSalary: number,
  serviceYears: number,
): PensionResult {
  // Per Thai civil-service rules: บำเหน็จ (lump-sum gratuity) uses last-month
  // salary for BOTH GFP and non-GFP members. Only บำนาญ (monthly pension)
  // differs — GFP uses the 60-month average with a 70% cap, non-GFP uses
  // last-month salary directly.
  const formula1 = (avg60Months * serviceYears) / 50;
  const formula2 = avg60Months * 0.7;
  const monthly = Math.min(formula1, formula2);
  const lumpSum = lastSalary * serviceYears;
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
  /**
   * True if this row is the synthetic "วันก่อนพ้นราชการ" marker appended at
   * the end of the table. It carries the salary that applied on the last day
   * of work (= same as the previous fiscal-round row), is not counted in the
   * 60-month average (monthsInWindow = 0), and is rendered as informational
   * only — not editable, no pencil/trash icons. For non-GFP this row is the
   * "เงินเดือนสุดท้าย" used directly by the lump-sum / monthly formula.
   */
  isExitMarker?: boolean;
}

/**
 * Inclusive month count between two dates as a precise float — uses average
 * month length (30.4375 days). Returns the raw value (NO rounding) so short
 * partial periods (1-4 days from boundary+N exits like 2/4, 5/4, 2/10) keep
 * their fractional weight in the avg-60 calculation. Display sites round
 * for the badge ("X เดือน" / "X วัน") and total ("รวม X / 60 เดือน").
 */
function monthsInRange(start: Date, end: Date): number {
  if (end.getTime() < start.getTime()) return 0;
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
  return days / 30.4375;
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

  // Avg % for future-projection rows. Filter > 0 (ignoring blank rounds) and
  // round to 1 decimal place to match the value displayed in Step 4
  // (ค่าเฉลี่ยการเลื่อนเงินเดือน) — keeps the calculation table's "ประมาณ"
  // rows consistent with the user-facing summary. Falls back to 3.5% if no
  // valid entries.
  const validIncreases = increases.filter((v) => !isNaN(v) && v > 0);
  const avgPercent =
    validIncreases.length > 0
      ? Math.round(
          (validIncreases.reduce((a, b) => a + b, 0) /
            validIncreases.length) *
            10,
        ) / 10
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

  // 60-month window boundaries (calendar-precise). Computed early so they're
  // available both for the override-staleness check below and the post-pass
  // monthsInWindow calculation later.
  const windowStart = new Date(endDate);
  windowStart.setMonth(windowStart.getMonth() - 60);
  const windowEnd = new Date(endDate);
  windowEnd.setDate(windowEnd.getDate() - 1);

  // Build the list of fiscal-round cursor dates from firstRound → anchorRound.
  // We walk in two phases anchored at the assessment row: backward from the
  // assessment row, then forward — so we need to know each row's index up
  // front to attach the right override slot.
  const rounds: Date[] = [];
  {
    const cursor = new Date(firstRound);
    let safety = 0;
    while (cursor.getTime() <= anchorRound.getTime() && safety < 200) {
      rounds.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 6);
      safety++;
    }
  }
  if (rounds.length === 0) return records;

  // Find the assessment row's position. snappedAssessment is always a
  // fiscal-boundary date and falls within [firstRound, anchorRound] in the
  // common case. If snappedAssessment is past anchorRound (assessment after
  // last fiscal round before exit), the only row IS at anchorRound — anchor
  // the chain there with newSalary = currentSalary as a degenerate case.
  let anchorIdx = rounds.findIndex(
    (r) => r.getTime() === snappedAssessment.getTime(),
  );
  if (anchorIdx === -1) anchorIdx = rounds.length - 1;

  // Reverse-compute oldSalary given a known newSalary, percent, and level.
  // Formula (forward): newSalary = oldSalary + roundUp10(useBase × %/100),
  // where useBase = baseBottom if oldSalary ≤ baseMid else baseTop.
  // Inverse: try both bracket assumptions and pick the one whose candidate
  // oldSalary is consistent with the bracket it claims.
  const reverseOldSalary = (
    newSalary: number,
    percent: number,
    baseInfo: SalaryBaseInfo,
  ): number => {
    if (percent <= 0 || newSalary <= 0) return newSalary;
    const incBottom = roundUp10(baseInfo.baseBottom * (percent / 100));
    const candBottom = newSalary - incBottom;
    if (candBottom > 0 && candBottom <= baseInfo.baseMid) return candBottom;
    const incTop = roundUp10(baseInfo.baseTop * (percent / 100));
    const candTop = newSalary - incTop;
    return Math.max(0, candTop);
  };

  // Resolve per-row config (level, baseInfo, displayed date, percent, flags).
  const getRowConfig = (idx: number, cursorDate: Date) => {
    const override = overrides[idx];
    const rowLevel = override?.level ?? level;
    const rowBaseInfo =
      rowLevel === level
        ? defaultBaseInfo
        : (getSalaryBaseForLevel(rowLevel, salaryBases) ?? defaultBaseInfo);

    // STALENESS GUARD: ignore overrides whose effectiveDate falls outside the
    // current 60-month window — handles the case where the user changed exit
    // date (window shifted) but old positional overrides remain.
    const rowDate = (() => {
      if (!override?.effectiveDate) return cursorDate;
      const od = new Date(override.effectiveDate);
      if (isNaN(od.getTime())) return cursorDate;
      if (
        od.getTime() < windowStart.getTime() ||
        od.getTime() > windowEnd.getTime()
      ) {
        return cursorDate;
      }
      return od;
    })();

    // Round offset relative to snappedAssessment:
    //   0  = the assessment-date round (latest raise = "ปัจจุบัน")
    //   −N = N rounds before assessment (historical % from increases[N])
    //   +N = N rounds after assessment (future projection = "ประมาณ")
    const monthsDiff =
      (cursorDate.getFullYear() - snappedAssessment.getFullYear()) * 12 +
      (cursorDate.getMonth() - snappedAssessment.getMonth());
    const roundOffset = Math.round(monthsDiff / 6);
    const increasesIdx = -roundOffset;
    const computedPercent =
      increasesIdx >= 0 && increasesIdx < increases.length
        ? increases[increasesIdx]
        : avgPercent;
    const percent = override?.percent ?? computedPercent;

    return {
      override,
      rowLevel,
      rowBaseInfo,
      rowDate,
      percent,
      isCurrent: roundOffset === 0,
      isEstimated: roundOffset > 0,
    };
  };

  const formatLabel = (d: Date) =>
    `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${toBE(d.getFullYear())}`;

  const slots: (SalaryRecord | null)[] = new Array(rounds.length).fill(null);

  // Compute the DEFAULT oldSalary for the OLDEST row by reversing back from
  // currentSalary through every row's percent. This is only the seed used
  // when row 0 has no override.oldSalary — once user pins ANY field, the
  // forward walk below recomputes everything from that pivot onward, even
  // overriding the anchor row's newSalary if necessary.
  //
  // (Cascade rule the user expects: editing any old row's oldSalary or %
  // propagates forward to all newer rows. The anchor's currentSalary acts as
  // a default seed only — the user's explicit edits take precedence.)
  //
  // Loop runs i = anchorIdx → 0 (inclusive). At iteration start, `salary`
  // holds the NEW salary at row i; `reverseOldSalary` converts it to the OLD
  // salary at row i. The chain assumption (oldSalary[i] = newSalary[i-1])
  // means after each step, `salary` is also the NEW salary at row i-1, ready
  // for the next iteration. After the final i=0 step, `salary` = oldSalary
  // at row 0 — the seed we need.
  let seedFirstOldSalary: number;
  {
    let salary = currentSalary;
    for (let i = anchorIdx; i >= 0; i--) {
      const cfg = getRowConfig(i, rounds[i]);
      salary = reverseOldSalary(salary, cfg.percent, cfg.rowBaseInfo);
    }
    seedFirstOldSalary = salary;
  }

  // Forward walk through ALL rows, oldest → newest. Each row's oldSalary
  // chains from the previous row's newSalary unless override.oldSalary
  // pins it. Each row's newSalary = oldSalary + roundUp10(useBase × %/100)
  // capped at fullSalary, unless override.newSalary pins it.
  let prevNew: number | null = null;
  for (let i = 0; i < rounds.length; i++) {
    const cfg = getRowConfig(i, rounds[i]);
    const ovOld = cfg.override?.oldSalary;
    const ovNew = cfg.override?.newSalary;

    let rowOld: number;
    if (ovOld != null && Number.isFinite(ovOld)) {
      rowOld = ovOld;
    } else if (prevNew !== null) {
      rowOld = prevNew;
    } else {
      rowOld = seedFirstOldSalary;
    }

    const useBase = selectBaseForSalary(rowOld, cfg.rowBaseInfo);
    const rawIncrease = useBase * (cfg.percent / 100);
    const proposedIncrease = roundUp10(rawIncrease);
    const computedNew = Math.min(
      rowOld + proposedIncrease,
      cfg.rowBaseInfo.fullSalary,
    );
    const rowNew =
      ovNew != null && Number.isFinite(ovNew)
        ? Math.min(ovNew, cfg.rowBaseInfo.fullSalary)
        : computedNew;
    const actualIncrease = Math.max(0, rowNew - rowOld);

    slots[i] = {
      period: cfg.rowDate.toISOString(),
      periodLabel: formatLabel(cfg.rowDate),
      level: cfg.rowLevel,
      oldSalary: rowOld,
      maxSalary: cfg.rowBaseInfo.fullSalary,
      base: useBase,
      percent: cfg.percent,
      increase: Math.round(rawIncrease * 100) / 100,
      actualIncrease,
      newSalary: rowNew,
      isEstimated: cfg.isEstimated,
      isCurrent: cfg.isCurrent,
      monthsInWindow: 0,
    };

    prevNew = rowNew;
  }

  for (const r of slots) if (r) records.push(r);

  // Post-pass: compute monthsInWindow per row based on overlap with the
  // 60-month averaging window [windowStart, windowEnd] (computed at the
  // top of this function; reused here).
  // Each row's "fiscal period" = [period, nextRow.period − 1 day] (or
  // [period, windowEnd] for the last row).
  const enriched: SalaryRecord[] = records.map((r, idx) => {
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

  // Display tweak: align the first counting row's period to the calendar-
  // precise windowStart so users see (per improve-cal.txt scenario 3 and
  // the user's expectation): for ลาออก 2/10 → first row labeled "2/10",
  // for ลาออก 1/6 → first row labeled "1/6". The salary itself is still
  // the salary that took effect at the previous fiscal boundary (which
  // is what was applied in the walk loop), and monthsInWindow already
  // reflects the partial overlap correctly.
  const firstCountingIdx = enriched.findIndex((r) => r.monthsInWindow > 0);
  if (firstCountingIdx !== -1) {
    const firstCountingRow = enriched[firstCountingIdx];
    const rowFiscalStart = new Date(firstCountingRow.period);
    if (rowFiscalStart.getTime() < windowStart.getTime()) {
      firstCountingRow.period = windowStart.toISOString();
      firstCountingRow.periodLabel = `${windowStart
        .getDate()
        .toString()
        .padStart(2, "0")}/${(windowStart.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${toBE(windowStart.getFullYear())}`;
    }
  }

  // Append the synthetic "วันก่อนพ้นราชการ" marker row.
  //
  // Special Thai-civil-service rule: when retirement falls on a fiscal-year
  // boundary (1/4 or 1/10 — typical retirement at age 60 lands on 1/10), the
  // retiree gets the next fiscal raise applied 1 day BEFORE retirement (i.e.
  // on 30/9 for retire 1/10). That single day at the raised salary IS counted
  // toward the 60-month average.
  //   → monthsInWindow ≈ 1/30.4375 (one day expressed in months)
  //   → previous row's monthsInWindow is reduced by the same amount to keep
  //     the total at exactly 60 months
  //   → newSalary on the marker reflects the raise (oldSalary + actualIncrease)
  //   → for non-GFP this becomes the "เงินเดือนสุดท้าย" used by the formula
  //
  // For non-fiscal exits (e.g., resignation 1/6) the marker carries the same
  // salary as the previous row and contributes nothing to the average.
  if (enriched.length > 0) {
    const lastReal = enriched[enriched.length - 1];
    const markerDate = new Date(endDate);
    markerDate.setDate(markerDate.getDate() - 1);

    // Skip marker creation when endDate − 1 day collides with the last actual
    // row's period — happens when exit is exactly 1 day after a fiscal
    // boundary (e.g. ลาออก 2/4 → marker would be 1/4, but that's already the
    // last fiscal-round row). The last actual row already represents the
    // day-before-exit; adding a duplicate would just confuse the table.
    const lastRealPeriodMs = new Date(lastReal.period).getTime();
    const skipMarker = markerDate.getTime() === lastRealPeriodMs;

    // The marker row's positional index = enriched.length (next push slot).
    // Per-row overrides[] is indexed by record position, so consult that slot
    // for level/percent/oldSalary overrides on the marker.
    const markerIdx = enriched.length;
    const markerOverride = overrides[markerIdx];
    const markerLevel = markerOverride?.level ?? lastReal.level;
    const markerBaseInfo =
      getSalaryBaseForLevel(markerLevel, salaryBases) ??
      getSalaryBaseForLevel(lastReal.level, salaryBases);

    // Detect fiscal-boundary exit: endDate is exactly 1 April or 1 October.
    const exitDay = endDate.getDate();
    const exitMonth = endDate.getMonth(); // 0-based: 3 = Apr, 9 = Oct
    const isFiscalBoundaryExit =
      exitDay === 1 && (exitMonth === 3 || exitMonth === 9);

    // Default % for the marker: avgPercent on fiscal-boundary exits (the
    // legitimate day-before-exit raise), 0 otherwise. Override wins when set.
    const overridePercent = markerOverride?.percent;
    const hasPercentOverride =
      overridePercent != null && Number.isFinite(overridePercent);
    const effectivePercent = hasPercentOverride
      ? overridePercent
      : isFiscalBoundaryExit
        ? avgPercent
        : 0;

    // oldSalary: override pins it, else chain from previous row.
    const overrideOldSalary = markerOverride?.oldSalary;
    const hasOldOverride =
      overrideOldSalary != null && Number.isFinite(overrideOldSalary);
    const markerOldSalary = hasOldOverride
      ? overrideOldSalary
      : lastReal.newSalary;

    // newSalary: override.newSalary pins the post-raise value (capped at
    // fullSalary); else compute from oldSalary + (effectivePercent raise).
    const overrideNewSalary = markerOverride?.newSalary;
    const hasNewOverride =
      overrideNewSalary != null && Number.isFinite(overrideNewSalary);

    let markerNewSalary = markerOldSalary;
    let markerBase = 0;
    let markerIncrease = 0;
    let markerActualIncrease = 0;
    let markerMonthsInWindow = 0;

    if (markerBaseInfo) {
      if (hasNewOverride) {
        const cappedNewSalary = Math.min(
          overrideNewSalary,
          markerBaseInfo.fullSalary,
        );
        markerNewSalary = cappedNewSalary;
        markerActualIncrease = Math.max(0, cappedNewSalary - markerOldSalary);
        markerBase = selectBaseForSalary(markerOldSalary, markerBaseInfo);
        markerIncrease = markerActualIncrease;
      } else if (effectivePercent > 0) {
        const useBase = selectBaseForSalary(markerOldSalary, markerBaseInfo);
        const rawIncrease = useBase * (effectivePercent / 100);
        const proposedIncrease = roundUp10(rawIncrease);
        const cappedNewSalary = Math.min(
          markerOldSalary + proposedIncrease,
          markerBaseInfo.fullSalary,
        );
        markerBase = useBase;
        markerIncrease = Math.round(rawIncrease * 100) / 100;
        // actualIncrease reflects the real change (cap-aware).
        markerActualIncrease = Math.max(0, cappedNewSalary - markerOldSalary);
        markerNewSalary = cappedNewSalary;
      }

      // Only fiscal-boundary exits get the 1-day-in-window credit (Thai rule).
      // A non-fiscal exit with a user-overridden % or newSalary applies to
      // lastSalary but is NOT added to the avg-60 window.
      if (
        isFiscalBoundaryExit &&
        markerActualIncrease > 0 &&
        !hasNewOverride
      ) {
        const oneDayInMonths = 1 / 30.4375;
        markerMonthsInWindow = oneDayInMonths;
        lastReal.monthsInWindow = Math.max(
          0,
          lastReal.monthsInWindow - oneDayInMonths,
        );
      }
    }

    if (!skipMarker) {
      enriched.push({
        period: markerDate.toISOString(),
        periodLabel: `${markerDate.getDate().toString().padStart(2, "0")}/${(
          markerDate.getMonth() + 1
        ).toString().padStart(2, "0")}/${toBE(markerDate.getFullYear())}`,
        level: markerLevel,
        oldSalary: markerOldSalary,
        maxSalary: markerBaseInfo?.fullSalary ?? lastReal.maxSalary,
        base: markerBase,
        percent: effectivePercent,
        increase: markerIncrease,
        actualIncrease: markerActualIncrease,
        newSalary: markerNewSalary,
        isEstimated: false,
        isCurrent: false,
        monthsInWindow: markerMonthsInWindow,
        isExitMarker: true,
      });
    }
  }

  return enriched;
}
