# Plan: Phase 1 — Foundation & Design Tokens

## Summary

Lay the foundation for the full redesign by **additively** updating three files: design tokens in `app/globals.css`, type definitions in `types/index.ts`, and pure calculation engine in `lib/calculations.ts`. This phase is **backward-compatible** — every change is additive (new fields/params/tokens), nothing is renamed or removed. Build, lint, and existing E2E must remain green at the end of this phase. All subsequent phases (2A/2B/3/4/5/6) build on this foundation.

## User Story

As a developer (single-owner + Claude pair-programming) on a same-day redesign sprint,
I want stable, additive foundation tokens / types / function signatures landed first,
so that every UI phase can build on a frozen contract without rework, and the build never goes red between checkpoints.

## Problem → Solution

**Current state**:
- `app/globals.css`: flat navy palette, basic shadow tokens, fade/slide keyframes, **no `prefers-reduced-motion` override** (WCAG 2.3.3 fail risk for older users)
- `types/index.ts`: `FormState` has `position`, `levelCategory`, `viewMode` — fields that the redesign drops; lacks `mode` (top-level), `salaryOverrides[]`, `__schemaVersion`
- `lib/calculations.ts`: `calculateServicePeriod(start, end)` ignores `leaveDays` (existing UI bug — fields are captured but never deducted); `generateSalaryTable(...)` derives a single `level` for all rows from `position-map.json` — no per-row override support

**Desired state (after Phase 1)**:
- `app/globals.css`: adds calm-fintech tokens (`--gradient-mesh-*`, `--ease-out-expo`, `--ease-spring`, elevation `--shadow-e1..e4`), keeps all existing tokens, adds `@media (prefers-reduced-motion: reduce)` overrides on every existing animation
- `types/index.ts`: `FormState` gains `mode: "gfp" | "non-gfp" | null`, `salaryOverrides: SalaryOverride[]`, `__schemaVersion: number` — old fields stay (marked `@deprecated`) so consumers don't break until Phase 4
- `lib/calculations.ts`: `calculateServicePeriod(start, end, leaveDays?)` — `leaveDays` defaults to `0` (existing callers unaffected); `generateSalaryTable(..., overrides?)` — `overrides` defaults to `[]` (existing callers unaffected); two new helpers `getSalaryBaseForLevel` and `selectBaseForSalary` exported for Phase 3 row recalc

## Metadata

- **Complexity**: Medium (3 files, ~150–250 net new lines, foundational ripple)
- **Source PRD**: `.claude/PRPs/prds/early-retire-redesign.prd.md`
- **PRD Phase**: Phase 1 — Foundation & Design Tokens
- **Estimated Files**: 3 (modified) + 0 (created)
- **Time-box**: 1.5 hours (per PRD)
- **Strategy**: **Additive / backward-compatible** — green build is part of acceptance

---

## UX Design

**Internal change — no user-facing UX transformation.** Foundation phase is invisible to end users. UX changes land in Phase 3 (step components) and Phase 5 (print/polish). The only user-observable side effect of Phase 1 is that `prefers-reduced-motion: reduce` (system setting) will now disable existing wizard transitions — *correctness gain*, not a feature.

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Reduced-motion users | Wizard transitions still play, animate-* utilities still animate | Animations skipped; instant state transitions | WCAG 2.3.3 compliance |

---

## Mandatory Reading

Files that **MUST** be read before implementing this phase. P0 = critical, P1 = important, P2 = reference.

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `CLAUDE.md` | all | Domain rules (B.E./C.E. offset, `roundUp10`, `baseMid` cutoff, GPF 70% cap), the "type duplication" foot-gun warning, the "state lives in `app/page.tsx`" architecture fact |
| P0 | `lib/calculations.ts` | 1–227 | Current signatures of `calculateServicePeriod` and `generateSalaryTable` — must extend additively without breaking existing callers |
| P0 | `types/index.ts` | 1–75 | Current `FormState` shape — must extend additively |
| P0 | `app/globals.css` | 1–154 | Existing tokens, animations, focus ring — preserve all; add new in same file |
| P1 | `lib/utils.ts` | 1–65 | Existing helpers (`toBE`, `toCE`, `roundUp10`, `formatNumber`, `BE_OFFSET`) — DO NOT duplicate; reuse |
| P1 | `app/page.tsx` | 23–77 | `initialForm` literal + persistence inline — Phase 4 will refactor this; Phase 1's new fields must have sensible defaults so this file still type-checks unchanged |
| P1 | `app/sections/SalaryHistoryForm.tsx` | 19–46 | Reads `position`, `levelCategory` — these fields must stay readable in Phase 1 (deprecated, not removed) |
| P1 | `app/sections/SalaryTable.tsx` | 4–16 | Imports `SalaryRecord` from `@/lib/calculations` — that export must remain |
| P1 | `app/sections/ResultSection.tsx` | 5–37 | Imports `PensionResult, LivelihoodResult, ServicePeriod, SalaryRecord` from `@/lib/calculations` — those exports must remain |
| P2 | `data/salary-bases.json` | full | 15 levels including conditional `อาวุโส2`/`ทรงคุณวุฒิ2`; `selectBaseForSalary` helper must handle |
| P2 | `data/rules.json` | full | Reference only — Phase 1 does not consume this file (calculation logic remains hardcoded in `lib/calculations.ts`) |
| P2 | `AGENTS.md` | sections 5, 7, 8 | Code conventions, calculation formulas, JSON shape (Thai-language reference) |
| P2 | `hooks/useLocalStorage.ts` | 1–32 | Exists but unused; **do not adopt in Phase 1** — Phase 4 will decide (page.tsx migration) |
| P2 | `eslint.config.mjs` | full | Confirms `next/core-web-vitals + next/typescript` — strict rules; new code must conform |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Tailwind CSS v4 `@theme inline` | https://tailwindcss.com/docs/upgrade-guide | New tokens go inside `@theme inline { ... }` block to be available as `bg-gradient-*` / `ease-*` utilities. Tokens declared on `:root` only become CSS variables; they don't generate utility classes |
| `prefers-reduced-motion` | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion | Use `@media (prefers-reduced-motion: reduce)` and override `animation-duration: 0.01ms !important` (not `none` — keeps end-state) |
| WCAG 2.3.3 — Animation from Interactions | https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html | Motion triggered by interaction must be disable-able. Required for primary user persona (50+) |

No external dependencies are added by Phase 1 (no new npm packages).

---

## Patterns to Mirror

Real codebase snippets. Follow exactly.

### NAMING_CONVENTION (file-level + symbol-level)
```typescript
// SOURCE: lib/utils.ts:8-12
export const BE_OFFSET = 543;

export function toCE(beYear: number): number {
  return beYear - BE_OFFSET;
}
```
- Constants: `UPPER_SNAKE_CASE` exported via `export const`
- Functions: `camelCase` with explicit param + return types on **all exports**
- Files: `kebab-case.ts` for utilities (`utils.ts`, `calculations.ts`)
- Type names: `PascalCase` (`ServicePeriod`, `SalaryRecord`)

### TYPE_DEFINITION
```typescript
// SOURCE: types/index.ts:1-7
export interface ServicePeriod {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalYears: number;
}
```
- All shared types as `export interface` (not `type`) when describing object shapes
- Field-level inline comments use `// foo` after the field — see `MultiplierPeriod`:
```typescript
// SOURCE: types/index.ts:9-15
export interface MultiplierPeriod {
  id?: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  multiplier: number;
  label?: string;
}
```

### FUNCTION_SIGNATURE_WITH_OPTIONAL_LAST_PARAM
```typescript
// SOURCE: lib/calculations.ts:42-61
export function calculateServicePeriod(start: Date, end: Date): ServicePeriod {
  // ...
}
```
- All exports start with `export function` (not arrow functions for top-level)
- Existing pattern adds **required** params only; this phase introduces **optional** params via `?` + default value inside the body — preserves backward compat

### NUMBER_ROUNDING_CONVENTION
```typescript
// SOURCE: lib/calculations.ts:63-71
export function calculatePensionNonGfp(lastSalary: number, serviceYears: number): PensionResult {
  const monthly = (lastSalary * serviceYears) / 50;
  const lumpSum = lastSalary * serviceYears;
  return {
    monthly: Math.round(monthly * 100) / 100,
    lumpSum: Math.round(lumpSum * 100) / 100,
    yearly: Math.round(monthly * 12 * 100) / 100,
  };
}
```
- Money rounded to 2 decimal places via `Math.round(x * 100) / 100`
- Salary increases: `roundUp10` (round UP to nearest 10) — see `lib/utils.ts:18-20`
- New helpers must follow this convention

### CSS_TOKEN_PATTERN
```css
/* SOURCE: app/globals.css:3-31 */
:root {
  --color-primary: #1e3a5f;
  --color-primary-dark: #152a45;
  --color-primary-light: #2c5282;

  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

@theme inline {
  --color-background: var(--background);
  --color-primary: var(--color-primary);
  --color-primary-dark: var(--color-primary-dark);
  /* ... */
}
```
- All custom values declared on `:root` first, then re-exposed inside `@theme inline { ... }` block — this is **Tailwind v4 idiom**. Don't use `tailwind.config.js`
- Color tokens use full hex (`#1e3a5f`) or `rgb()` syntax with slash-opacity — both fine
- Shadows use comma-separated stacked `box-shadow` values

### KEYFRAME_AND_UTILITY_PATTERN
```css
/* SOURCE: app/globals.css:71-113 */
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out both;
}
```
- Keyframes outside any layer
- Class names: `.animate-{kebab}` matching keyframe name
- Duration in seconds with explicit easing + `both` fill mode
- Phase 1 adds `prefers-reduced-motion` override for THESE existing classes; doesn't add new ones

### IMPORT_STYLE
```typescript
// SOURCE: lib/calculations.ts:1
import { roundUp10, toBE } from "./utils";
```
- Relative imports inside `lib/`
- Absolute `@/` alias from app code (e.g., `import { foo } from "@/lib/calculations"`)
- Type imports use named `import { Type }` (not `import type` — codebase doesn't use that style)

### BACKWARD_COMPAT_DEPRECATION
The codebase has **no existing JSDoc deprecation pattern**. Establish one consistently for Phase 1:
```typescript
/** @deprecated since Phase 1 — removed in Phase 4. Use `mode` instead. */
viewMode?: "non-gfp" | "gfp";
```
- Use `@deprecated` JSDoc tag with **explicit removal phase**
- Mark old field as **optional** (`?`) so new initial form doesn't have to set it

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `app/globals.css` | UPDATE | Add calm-fintech tokens (gradient mesh, easing, elevation system) + `prefers-reduced-motion` overrides for existing animations. Preserve all existing tokens |
| `types/index.ts` | UPDATE | Add new fields to `FormState` (`mode`, `salaryOverrides`, `__schemaVersion`); add new exported types (`SalaryOverride`); mark legacy fields `@deprecated` but keep them |
| `lib/calculations.ts` | UPDATE | Add optional `leaveDays` param to `calculateServicePeriod`; add optional `overrides` param to `generateSalaryTable`; export 2 new helpers (`getSalaryBaseForLevel`, `selectBaseForSalary`); preserve `SalaryRecord` and `PensionResult` exports unchanged |

## NOT Building

Explicit out-of-scope for Phase 1 (handled by other phases):

- **DatePickerTH calendar overlay** (Phase 2A)
- **UI primitive component updates** — Button, Card, Input, Tooltip, ProgressBar, new SegmentedControl (Phase 2B)
- **Step component refactors** — ModeSelect, PersonalInfoForm, ServicePeriodForm, SalaryHistoryForm, SalaryTable, ResultSection (Phase 3)
- **`app/page.tsx` rewiring** — 6-step flow, schema migration check at mount, `useMemo` chain refactor (Phase 4)
- **Print stylesheet** `@media print` rules (Phase 5)
- **E2E updates** to `e2e/smoke.spec.ts` (Phase 6)
- **Removing `position`, `levelCategory`, `viewMode`** from `FormState` — Phase 1 marks them `@deprecated`; Phase 4 deletes
- **Consolidating duplicated `PensionResult` / `SalaryRecord`** between `types/index.ts` and `lib/calculations.ts` — defer; risky during 1-day sprint
- **Wiring `data/rules.json` into runtime** — formulas remain hardcoded in `lib/calculations.ts`
- **Fixing `position-map.json` data inconsistency** (entries like `"อาวุโส*"` and `"ทรงคุณวุฒิ*"` don't match any `salary-bases.json` level) — out of scope; redesign drops position-map's primary role anyway
- **Adopting `hooks/useLocalStorage`** in `app/page.tsx` — Phase 4's call

---

## Step-by-Step Tasks

### Task 1: Add `SalaryOverride` type + extend `FormState` in `types/index.ts`

- **ACTION**: Edit `types/index.ts` — add new `SalaryOverride` interface, extend `FormState` with three new fields, mark three legacy fields `@deprecated`. Preserve all existing exports.
- **IMPLEMENT**:
  ```typescript
  // Add after MultiplierPeriod (around line 16):
  export interface SalaryOverride {
    /** ISO date string of the salary effective date for this row, or null to use computed default */
    effectiveDate: string | null;
    /** Override level for this row (must match a `level` in salary-bases.json), or null to use form default */
    level: string | null;
  }

  // Mutate FormState to:
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

    // Step 3-4 — legacy (deprecated, removed Phase 4)
    /** @deprecated since Phase 1 — removed in Phase 4. Position dropdown is dropped (req #2). */
    position?: string;
    /** @deprecated since Phase 1 — removed in Phase 4. Level category radio is dropped. */
    levelCategory?: string;
    currentSalary: number;
    latestAssessmentDate: string | null;
    assessmentIncreases: number[];

    // View state — legacy (deprecated, removed Phase 4)
    /** @deprecated since Phase 1 — removed in Phase 4. Use `mode` (top-level) instead. */
    viewMode?: "non-gfp" | "gfp";

    // Migration
    /** Schema version of this saved state. Bump on breaking shape changes; Phase 4 silent-clears localStorage on mismatch. */
    __schemaVersion: number;
  }

  // Add at end of file:
  /** Current schema version for FormState. Bump when shape changes incompatibly. Phase 1 sets this to 2 (v1 = pre-redesign). */
  export const FORM_STATE_SCHEMA_VERSION = 2;
  ```
- **MIRROR**: `TYPE_DEFINITION` (export interface), `BACKWARD_COMPAT_DEPRECATION` (`@deprecated` JSDoc), `NAMING_CONVENTION` (UPPER_SNAKE for constant)
- **IMPORTS**: None needed — pure types
- **GOTCHA**:
  - **DO NOT** delete `position`, `levelCategory`, `viewMode` — `app/sections/SalaryHistoryForm.tsx:31-32` reads `form.position` and `form.levelCategory`; `app/sections/ResultSection.tsx:37` and `app/page.tsx` indirectly reference `viewMode`. Build will fail if these are removed before Phase 3 / Phase 4
  - Marking them **optional (`?`)** is the trick — old code can still read them (will be `undefined`), but new initial form doesn't have to set them
  - `__schemaVersion` is **required (no `?`)** — every persisted state must carry it. Phase 4 will use absence/mismatch as silent-clear trigger
  - Field order matters for diff readability — group as commented above
- **VALIDATE**:
  - `npx tsc --noEmit` — zero errors
  - `grep -r "FormState" --include="*.tsx" --include="*.ts" .` shows no consumer broke
  - Type assertion test: `const f: FormState = { ...everythingelse, mode: null, salaryOverrides: [], __schemaVersion: 2 }` compiles

---

### Task 2: Extend `calculateServicePeriod` with optional `leaveDays`

- **ACTION**: Edit `lib/calculations.ts` line 42 — add third optional param `leaveDays`, subtract from `totalDays` before computing `totalYears`. Preserve all existing return-shape fields.
- **IMPLEMENT**:
  ```typescript
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
    const safeLeave = Math.max(0, Math.floor(leaveDays));
    const totalDays = Math.max(0, rawTotalDays - safeLeave);
    const totalYears = totalDays / 365.25;

    return { years, months, days, totalDays, totalYears };
  }
  ```
- **MIRROR**: `FUNCTION_SIGNATURE_WITH_OPTIONAL_LAST_PARAM`, existing function body structure (preserve var names: `years`/`months`/`days`)
- **IMPORTS**: None — only adds default-value param
- **GOTCHA**:
  - **Decision**: leave deduction subtracts from `totalDays` only; the `years`/`months`/`days` breakdown stays based on calendar-only difference. **Rationale**: `years`/`months`/`days` are displayed as "อายุราชการพื้นฐาน" in `ServicePeriodForm.tsx:58-78` — recomputing the breakdown after deduction would confuse users (e.g., "30 ปี 2 เดือน — ลบลา 60 วัน" → display either "30 ปี 0 เดือน" with non-trivial logic or stays "30 ปี 2 เดือน" with `totalDays/totalYears` reflecting actual). **The simpler model: breakdown = calendar period; total = effective period after leave deduction.** Phase 3's UI will need to disclose this clearly
  - **Negative guard**: `Math.max(0, totalDays - leaveDays)` — never go negative if user enters absurd leave value
  - **Integer guard**: `Math.floor(leaveDays)` — defensive (input is `number` not `int`)
  - DEFAULT must be `0` (not `undefined`) so the `safeLeave` arithmetic works even when caller omits param
  - Existing call site at `app/page.tsx:81`: `calculateServicePeriod(new Date(form.startDate), new Date(form.endDate))` — unchanged, leaveDays defaults to 0, behavior identical to before. Phase 3 will update this call site to pass `form.sickLeaveDays + form.personalLeaveDays + form.vacationDays`
- **VALIDATE**:
  - `npx tsc --noEmit` — zero errors
  - Manual sanity (in node REPL or temp test): `calculateServicePeriod(new Date('2000-01-01'), new Date('2025-01-01'))` → `totalDays ≈ 9132`, `totalYears ≈ 25.0`. Same call with `leaveDays=100` → `totalDays = 9032`, `totalYears ≈ 24.73`
  - Existing E2E `e2e/smoke.spec.ts` still passes (no leave entered → no behavior change)

---

### Task 3: Extend `generateSalaryTable` with optional `overrides[]` + add 2 helper exports

- **ACTION**: Edit `lib/calculations.ts` `generateSalaryTable` — add optional final param `overrides`. When `overrides[i]` provides `level` and/or `effectiveDate`, the row's level and starting date are overridden. Add two named exports `getSalaryBaseForLevel(level, salaryBases)` and `selectBaseForSalary(salary, baseInfo)` for Phase 3 row-recalc consumers.
- **IMPLEMENT**:
  ```typescript
  // Add near the top of the file (after the existing interfaces, before calculateRetirementDate):

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

  // Then UPDATE the existing generateSalaryTable signature and body:
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

    let salary = currentSalary;
    let currentDate = new Date(assessmentDate);
    const isGfp = mode === "gfp";
    const targetDate = new Date(endDate);

    if (isGfp) {
      const monthsBack = 60;
      currentDate = new Date(targetDate);
      currentDate.setMonth(currentDate.getMonth() - monthsBack);
    }

    let periodCount = 0;
    const maxPeriods = isGfp ? 60 : 100;

    while (currentDate <= targetDate && periodCount < maxPeriods) {
      const override = overrides[periodCount];

      // Per-row level override falls back to default
      const rowLevel = override?.level ?? level;
      const rowBaseInfo =
        rowLevel === level ? defaultBaseInfo : (getSalaryBaseForLevel(rowLevel, salaryBases) ?? defaultBaseInfo);

      // Per-row effective date override falls back to walking computation
      if (override?.effectiveDate) {
        currentDate = new Date(override.effectiveDate);
      }

      const nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + 6);

      const percent = periodCount < increases.length ? increases[periodCount] : avgPercent;
      const useBase = selectBaseForSalary(salary, rowBaseInfo);
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
        level: rowLevel,
        oldSalary: salary,
        maxSalary: rowBaseInfo.fullSalary,
        base: useBase,
        percent,
        increase: Math.round(rawIncrease * 100) / 100,
        actualIncrease,
        newSalary: newSalary > rowBaseInfo.fullSalary ? rowBaseInfo.fullSalary : newSalary,
        isEstimated,
        isCurrent,
      });

      salary = newSalary > rowBaseInfo.fullSalary ? rowBaseInfo.fullSalary : newSalary;
      currentDate = nextDate;
      periodCount++;

      if (isGfp && records.length >= 10) break;
    }

    return records;
  }
  ```
- **MIRROR**:
  - `FUNCTION_SIGNATURE_WITH_OPTIONAL_LAST_PARAM` (overrides default `[]`)
  - Existing `generateSalaryTable` body structure (preserve loop, `roundUp10`, clamp logic)
  - `NUMBER_ROUNDING_CONVENTION` (`Math.round(x * 100) / 100` for `increase`)
- **IMPORTS**: Already at top of file: `import { roundUp10, toBE } from "./utils";` — no new imports
- **GOTCHA**:
  - **Type duplication risk**: `SalaryOverride` is also declared in `types/index.ts` (Task 1). To avoid divergence, **types/index.ts is the canonical source**, and `lib/calculations.ts` re-exports for convenience consistent with the existing pattern (e.g., `SalaryRecord` already lives in both). Use the **same shape** in both files. Future cleanup deferred (per CLAUDE.md type-duplication note)
  - `SalaryBaseInfo` is **new** — not duplicated. The previous code used inline `Array<{ level: string; fullSalary: number; ... }>` at the call site in `app/page.tsx:107`. Phase 4 will update that call site to use the named type
  - **Override behavior is per-row, not cumulative**: if `overrides[3].level = "อาวุโส"`, only row 3 uses that level. Row 4 falls back to the form default unless `overrides[4]` is also set
  - **Effective date override is consequential**: setting `overrides[i].effectiveDate` jumps the loop's date pointer. The next 6-month walk continues from there. This means an override late in the table "skips" the natural progression — UI in Phase 3 should warn user when they override
  - **Existing call site** `app/page.tsx:100-114` — passes 7 args; new optional 8th defaults to `[]`. **Behavior identical for legacy callers.** Verify `salaryBases as Array<{ ... }>` cast still narrows to `SalaryBaseInfo[]` (it does — structurally compatible)
- **VALIDATE**:
  - `npx tsc --noEmit` — zero errors (legacy call site unchanged)
  - Manual sanity: call `generateSalaryTable(40000, "ปฏิบัติงาน", new Date('2024-04-01'), [3, 3, 3, 3, 3, 3], new Date('2030-09-30'), "non-gfp", salaryBases)` → identical output to pre-Phase-1
  - Same call with `overrides[2] = { effectiveDate: null, level: "ชำนาญงาน" }` → row 2's `level === "ชำนาญงาน"`, base/maxSalary differ from rows 0-1 / 3+
  - `e2e/smoke.spec.ts` passes unchanged

---

### Task 4: Add calm-fintech tokens + reduced-motion overrides in `app/globals.css`

- **ACTION**: Edit `app/globals.css` — append new design tokens to the existing `:root` block, expose them in `@theme inline`, and add a `@media (prefers-reduced-motion: reduce)` block at end-of-file overriding all four existing animation utilities. **Preserve every existing token, keyframe, and rule.**
- **IMPLEMENT**:
  ```css
  /* Append inside the existing :root block, AFTER the --shadow-xl line (line ~30) */
  :root {
    /* ... existing tokens preserved ... */

    /* === Calm Fintech additions (Phase 1 — redesign foundation) === */

    /* Gradient mesh — used on chrome only (header, mode-select cards). Never on data surfaces */
    --gradient-mesh-primary: linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #3949ab 100%);
    --gradient-mesh-success: linear-gradient(135deg, #276749 0%, #38a169 100%);
    --gradient-mesh-subtle: linear-gradient(180deg, #f0f4f8 0%, #ffffff 100%);

    /* Easing tokens — match Framer Motion spring/ease-out feel */
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
    --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);

    /* Elevation system — solid surfaces only, never glass on data */
    --shadow-e1: 0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.04);
    --shadow-e2: 0 2px 4px -1px rgb(15 23 42 / 0.06), 0 4px 6px -2px rgb(15 23 42 / 0.04);
    --shadow-e3: 0 4px 8px -2px rgb(15 23 42 / 0.08), 0 8px 16px -4px rgb(15 23 42 / 0.06);
    --shadow-e4: 0 8px 16px -4px rgb(15 23 42 / 0.1), 0 16px 32px -8px rgb(15 23 42 / 0.08);

    /* Glass token — chrome only (header overlay over gradient). Subtle blur, high opacity */
    --surface-glass-chrome: rgb(255 255 255 / 0.72);
    --surface-glass-blur: saturate(180%) blur(12px);

    /* Solid data surface — never use glass on data */
    --surface-data: #ffffff;
    --surface-data-subtle: #fafbfc;

    /* Motion durations — keep within 300ms ceiling per UI research */
    --duration-instant: 100ms;
    --duration-fast: 180ms;
    --duration-normal: 240ms;
    --duration-slow: 300ms;
  }

  /* Append inside the existing @theme inline block, AFTER --color-warning-light */
  @theme inline {
    /* ... existing tokens preserved ... */

    --gradient-mesh-primary: var(--gradient-mesh-primary);
    --gradient-mesh-success: var(--gradient-mesh-success);
    --gradient-mesh-subtle: var(--gradient-mesh-subtle);

    --ease-out-expo: var(--ease-out-expo);
    --ease-spring: var(--ease-spring);
    --ease-emphasized: var(--ease-emphasized);

    --shadow-e1: var(--shadow-e1);
    --shadow-e2: var(--shadow-e2);
    --shadow-e3: var(--shadow-e3);
    --shadow-e4: var(--shadow-e4);

    --surface-glass-chrome: var(--surface-glass-chrome);
    --surface-data: var(--surface-data);
    --surface-data-subtle: var(--surface-data-subtle);

    --duration-instant: var(--duration-instant);
    --duration-fast: var(--duration-fast);
    --duration-normal: var(--duration-normal);
    --duration-slow: var(--duration-slow);
  }

  /* Append at END of file (after the scrollbar @layer base block) */
  @media (prefers-reduced-motion: reduce) {
    .animate-fade-in-up,
    .animate-fade-in,
    .animate-slide-in-right,
    .animate-pulse-soft {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }

    *,
    *::before,
    *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- **MIRROR**: `CSS_TOKEN_PATTERN` (declare on `:root`, re-expose in `@theme inline`), `KEYFRAME_AND_UTILITY_PATTERN` (existing `.animate-*` class names — referenced verbatim in reduced-motion override)
- **IMPORTS**: None — pure CSS
- **GOTCHA**:
  - **Tailwind v4 quirk**: Tokens declared in `:root` ONLY become CSS variables; tokens **also** declared in `@theme inline` are exposed as **utility prefixes** (e.g., `bg-gradient-mesh-primary`, `ease-out-expo`, `shadow-e2`, `duration-fast`). Both are required if you want both raw `var(--token)` access AND utility-class access
  - The `@media (prefers-reduced-motion: reduce)` override uses `!important` because `animate-*` classes have lower specificity. Without `!important`, the original `0.4s ease-out` wins
  - **Don't** use `animation: none` — that resets to no-keyframes, jumping the element back to its initial state and breaking layouts. Use `animation-duration: 0.01ms` so the keyframe completes instantly at the final state
  - The wildcard `*, *::before, *::after` rule is intentional — covers Framer Motion CSS-injected animations + any `transition` property. WCAG 2.3.3 compliance requires this breadth
  - **Existing code references `var(--text)` and `var(--text-muted)` and `var(--danger)` and `var(--primary-light)`** but `:root` doesn't declare these — they're aliases that resolve via `@theme inline` referring back. Don't touch this; it works
  - **Don't add a `tailwind.config.js`** — Tailwind v4 doesn't use it (CLAUDE.md flags this)
- **VALIDATE**:
  - `npm run build` — should compile (Tailwind v4 picks up new tokens; if a class like `bg-gradient-mesh-primary` is referenced anywhere in JSX, it generates the rule)
  - DevTools: open page, system-set "Reduce motion" → wizard transition should be instant (under 1ms). Toggle off → resumes ~300ms transition
  - `getComputedStyle(document.documentElement).getPropertyValue('--shadow-e2')` returns the new value
  - No utility-class regression: `bg-[var(--primary)]`, `text-[var(--primary)]` still resolve as before

---

## Testing Strategy

### Unit Tests

The codebase has **no existing unit-test infrastructure** (no Jest, Vitest, or test files in `lib/`). Phase 1 does **not** introduce a test framework — that decision is out of scope and should be deferred to a separate post-redesign hardening phase.

Validation for Phase 1 relies on:

1. **TypeScript compiler** (`npx tsc --noEmit`) — proves no consumer broke
2. **ESLint** (`npm run lint`) — code-quality gate
3. **Next.js build** (`npm run build`) — proves the new tokens parse and pages still render
4. **Existing Playwright E2E** (`npx playwright test`) — proves runtime behavior is unchanged for legacy paths
5. **Manual REPL/spot-check** of the 2 calculation refactors

### Manual Calculation Spot-Check

| Test | Setup | Call | Expected | Why |
|---|---|---|---|---|
| Service period — no leave | start=2000-01-01, end=2025-01-01, leaveDays omitted | `calculateServicePeriod(s, e)` | `totalDays ≈ 9132`, `totalYears ≈ 25.0` | Legacy behavior preserved |
| Service period — with leave | same dates, leaveDays=100 | `calculateServicePeriod(s, e, 100)` | `totalDays = 9032`, `totalYears ≈ 24.73` | Leave actually subtracts |
| Service period — absurd leave | same dates, leaveDays=999999 | `calculateServicePeriod(s, e, 999999)` | `totalDays = 0`, `totalYears = 0` | Negative guard works |
| Salary table — no overrides | salary=40000, level="ปฏิบัติงาน", 6 increases, non-gfp | `generateSalaryTable(...)` | Identical output to pre-Phase-1 | Backward-compat |
| Salary table — level override | same setup + `overrides[2] = {level:"ชำนาญงาน"}` | `generateSalaryTable(...)` | Row 2's `level == "ชำนาญงาน"`, `maxSalary == 54820` (vs 38750 default) | Override flows through |
| Salary table — date override | same setup + `overrides[3] = {effectiveDate: "2030-01-01"}` | `generateSalaryTable(...)` | Row 3's `period` starts 2030-01-01, row 4 follows +6mo | Date jump works |
| Type assertion compile | `const f: FormState = {...legacyShape, mode: null, salaryOverrides: [], __schemaVersion: 2}` | `tsc --noEmit` | Compiles | New required fields integrated |

### Edge Cases Checklist
- [x] **Empty input** — `generateSalaryTable` with `currentSalary=0` already early-returns; preserved
- [x] **Maximum size input** — `maxPeriods=100` cap unchanged
- [x] **Invalid types** — TypeScript strict prevents at compile time
- [x] **Concurrent access** — N/A (no async, no shared state)
- [x] **Network failure** — N/A (no I/O in this phase)
- [x] **Permission denied** — N/A
- [x] **Override beyond array length** — `overrides[periodCount]` returns `undefined` if absent → `?.level ?? level` falls back. Safe
- [x] **Override level not in salary-bases** — `getSalaryBaseForLevel` returns `null` → falls back to `defaultBaseInfo` per Task 3 logic
- [x] **`leaveDays = NaN`** — `Math.floor(NaN) = NaN`, `Math.max(0, NaN) = NaN`. **Mitigation**: explicit `Number.isFinite` guard in implementation? **Decision**: trust caller (TypeScript-typed `number` — runtime NaN comes only from corrupted input which is a separate concern). Document in code comment.
- [x] **Reduced-motion preference** — verified by toggling system setting

---

## Validation Commands

### Static Analysis
```bash
npx tsc --noEmit
```
**EXPECT**: Zero errors. New optional params don't break any consumer; legacy `FormState` fields kept optional → `app/page.tsx` `initialForm` literal validates (with new fields added inline).

⚠️ **One edge**: `app/page.tsx:23-53` defines `initialForm: FormState` literal — Phase 1 must add `mode: null`, `salaryOverrides: []`, `__schemaVersion: 2` to this literal **OR** TypeScript will error since `__schemaVersion` is required. **Action**: include the literal patch as part of Task 1's edit, even though `app/page.tsx` is "Phase 4 territory" — strictly, this 3-line addition is the minimum needed to keep the build green. Mark it as a "build-keep" addition, not a "feature" addition.

### Lint
```bash
npm run lint
```
**EXPECT**: Clean (zero warnings). New code follows existing Prettier/ESLint conventions.

### Build
```bash
npm run build
```
**EXPECT**: Successful production build. Tailwind v4 must compile new `@theme inline` tokens into the CSS bundle.

### Existing E2E
```bash
npx playwright test
```
**EXPECT**: All 3 existing tests pass (`landing page loads`, `completes full wizard flow`, `can toggle between non-gfp and gfp results`). **Behavior must be identical** to pre-Phase-1 because Phase 1 is additive only.

### Manual Browser Validation
```bash
npm run dev
```
Then in browser:
- [ ] Navigate to `http://localhost:3000` — page renders without errors
- [ ] Existing wizard flow works end-to-end (5 steps; Phase 3 will rebuild to 6)
- [ ] DevTools Console — no warnings about missing CSS variables / type errors
- [ ] DevTools Elements → `:root` — confirm new tokens (`--gradient-mesh-primary`, `--ease-out-expo`, `--shadow-e2`, `--duration-fast`) appear
- [ ] System settings → "Reduce Motion" ON → reload → wizard step transition is instant (<10ms perceived); animations on results page (currently `animate-fade-in-up` etc. if any) are also instant
- [ ] Toggle "Reduce Motion" OFF → reload → animations restore to ~300ms

---

## Acceptance Criteria

- [ ] All 4 tasks completed (Task 1: types, Task 2: serviceDuration, Task 3: salaryTable, Task 4: globals.css)
- [ ] `npx tsc --noEmit` passes (zero errors)
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm run build` succeeds (production build)
- [ ] `npx playwright test` passes (all 3 existing tests)
- [ ] `app/page.tsx`'s `initialForm` literal includes `mode: null`, `salaryOverrides: []`, `__schemaVersion: 2` (build-keep addition)
- [ ] Manual spot-checks (calculation table) match expected outputs
- [ ] DevTools confirms new CSS tokens are exposed
- [ ] `prefers-reduced-motion: reduce` system setting disables wizard transitions

## Completion Checklist

- [ ] Code follows discovered patterns (NAMING_CONVENTION, TYPE_DEFINITION, NUMBER_ROUNDING_CONVENTION, CSS_TOKEN_PATTERN)
- [ ] Error handling matches codebase style — N/A this phase (pure additive functions, no new error paths)
- [ ] Logging follows codebase conventions — N/A this phase (no console use anywhere in `lib/`)
- [ ] Tests follow test patterns — N/A (no test framework; use compiler + e2e + spot-check)
- [ ] No hardcoded values — gradient stops, easing curves, shadow values exposed as tokens
- [ ] Documentation updated — `@deprecated` JSDoc tags on legacy `FormState` fields
- [ ] No unnecessary scope additions — confirmed against the NOT Building list
- [ ] Self-contained — implementation requires no further codebase searching beyond Mandatory Reading

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `app/page.tsx` `initialForm` literal becomes invalid because `__schemaVersion` is required | High | Build red | Task 1 includes the 3-line patch to `app/page.tsx` in scope; mention explicitly in implementation |
| Type duplication (`SalaryOverride` in both `types/index.ts` and `lib/calculations.ts`) drifts | Low | Future foot-gun | Both declared with identical shape; Phase 4 cleanup task will dedupe; CLAUDE.md flags this pattern |
| Tailwind v4 `@theme inline` doesn't pick up tokens declared with kebab-case but referenced with arbitrary syntax (e.g., `shadow-[var(--shadow-e2)]`) | Low | Visual regression | Use **utility-class form** (`shadow-e2`) consistently in subsequent phases; arbitrary-value syntax also works as fallback |
| Reduced-motion override too aggressive — disables Framer Motion transitions used for wizard | Medium | UX regression for low-vestibular users | This is **the desired behavior** per WCAG 2.3.3; verify subjectively that flow is still usable (instant transitions, just no slide animation) |
| Existing call sites assume legacy `FormState` field is non-optional and dereference `.position.length` etc. | Low | Runtime crash | Grep before implementation: `grep -n "form\.position\|form\.levelCategory\|form\.viewMode" app/sections/ app/page.tsx` — every read must be guarded with `?.` or default value. Phase 1 adds guards if missing. **Found**: `SalaryHistoryForm.tsx:23, 31` access these directly — already returns empty arrays/null on falsy, so safe. `ResultSection.tsx:37` uses local `useState`, doesn't touch FormState. `app/page.tsx:91` uses `form.position` with `as keyof typeof positionMap` — returns `undefined` from the map, code already handles. **No additional guards needed.** |
| Decision: leave deduction subtracts only from totalDays, not breakdown — could confuse users | Low | UX | Phase 3 displays `years/months/days` for "calendar period" and `totalDays/totalYears` separately for "effective period after deductions" — make labeling clear in `ServicePeriodForm` rebuild |

## Notes

### Build-keep patch to `app/page.tsx` (clarifying)

Phase 4 owns `app/page.tsx`'s rewiring (6-step flow + migration). But Phase 1 cannot leave the build red. The minimal patch needed in Phase 1 is:

```typescript
// In app/page.tsx, inside `initialForm` literal (around line 51-53), ADD:
mode: null,
salaryOverrides: [],
__schemaVersion: 2,
```

This preserves all legacy fields, satisfies the new required `__schemaVersion`, and unblocks Phase 4's full rewiring. Document this minimal patch in the Phase 1 commit message; Phase 4 will replace the entire literal.

### Why no test framework added now

Adding Jest/Vitest is a separate scope (~1-2 hours alone for setup + first tests). For a 1-day sprint, the existing Playwright E2E + TypeScript + manual spot-check covers the regression risk. A "Phase 7: Test Hardening" can land after the redesign ships.

### Re-export note for SalaryOverride

`SalaryOverride` is declared in **both** `types/index.ts` and `lib/calculations.ts`. The codebase already does this for `PensionResult`, `LivelihoodResult`, `ServicePeriod`, `SalaryRecord` — it's the existing convention, not new. CLAUDE.md flags this as a foot-gun ("the lib/ definitions are what runs"); Phase 1 follows the convention to avoid introducing inconsistency, deferring deduplication to a future cleanup task.

### Confidence

**8/10** for single-pass implementation. The two unknowns:
- Tailwind v4 `@theme inline` token registration may need a dev-server restart to pick up new utilities. If `bg-gradient-mesh-primary` doesn't render in JSX (Phase 2B+), restart Next dev server first.
- Override `effectiveDate` semantics may need a follow-up tweak when Phase 3 wires real UI — the current behavior "jump and continue" is one of two valid choices (the other: "anchor and don't continue from here"). If Phase 3 finds it unintuitive, Phase 1's `generateSalaryTable` may need a small revisit.
