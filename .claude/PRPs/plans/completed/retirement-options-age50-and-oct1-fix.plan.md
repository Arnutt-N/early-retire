# Plan: Retirement Rules Fix — Oct 1 Cutoff + อายุตัว 50 ปี Option

## Summary
Bundles all 6 PRD phases into a single self-contained implementation pass: branch → Oct 1 cutoff bug fix → new `age50` Step 2 option → strip descriptions from all 4 option pills → eligibility validation → e2e tests → CI gate + PR. The whole change touches ~5 source files plus docs and adds one e2e spec.

## User Story
As a Ministry of Justice civil servant evaluating early resignation, I want the calculator to (a) compute the correct retirement year for Oct 1 birthdays and (b) offer a guarded "อายุตัว 50 ปี" path with age-50/service-10 validation, so that I can trust the displayed end date and pension result without needing to second-guess the cutoff rule or the eligibility threshold.

## Problem → Solution
**Current state**: `lib/calculations.ts:71-82` treats anyone born on Oct 1 as if their fiscal-year retirement is delayed by one year (it's not — Oct 1 is the *last* day of the prior fiscal year). Step 2 has only 3 retirement options (`age60`, `service25`, `custom`) — no first-class path for early resignation at age 50, and each option pill carries description sub-text the user wants removed.

**Desired state**: `calculateRetirementDate` strictly distinguishes Oct 1 (no +1) from Oct 2+ (+1). Step 2 surfaces a 4th option **"อายุตัว 50 ปี"** with no auto-populated `endDate` and inline eligibility validation (age ≥ 50 AND service ≥ 10 at chosen `endDate`). All 4 option pills render label only — no description sub-text. Helper text and `CLAUDE.md` domain rule #2 are aligned with the corrected rule.

## Metadata
- **Complexity**: Small (1-3 source files, <250 lines diff total)
- **Source PRD**: `.claude/PRPs/prds/retirement-options-age50-and-oct1-fix.prd.md`
- **PRD Phase**: All (Phase 0 → Phase 5 bundled — see PRD's "Implementation Phases" table)
- **Estimated Files**: 5 source + 1 doc + 1 new e2e spec = 7 files

---

## UX Design

### Before

```
Step 2 — ข้อมูลส่วนตัว
┌──────────────────────────────────────────────────────────────┐
│  วันเกิด:   [วว] [ดด] [ปปปป]    วันบรรจุ:  [วว] [ดด] [ปปปป]    │
│                                                              │
│  📅 วันที่พ้นส่วนราชการ *                                       │
│   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
│   │ ◉ เกษียณอายุ 60ปี │ │ ○ อายุราชการ25ปี │ │ ○ กำหนดเอง   │ │
│   │  [แนะนำ]          │ │ คำนวณจากวันบรรจุ│ │ เลือกวันที่   │ │
│   │  คำนวณอัตโนมัติ   │ │   + 25 ปี        │ │   ด้วยตัวเอง  │ │
│   │   จากวันเกิด      │ │                  │ │              │ │
│   └──────────────────┘ └──────────────────┘ └──────────────┘ │
│                                                              │
│  [วว] [ดด] [ปปปป]  ✨ คำนวณอัตโนมัติจากวันเกิด                  │
│                       (+ 1 ปีหากเกิดตั้งแต่ 1 ต.ค.)  ← ผิด     │
│                                                              │
│   [กลับ]                                       [ถัดไป →]      │
└──────────────────────────────────────────────────────────────┘

Bug: birthDate = 1/10/2510 → endDate auto-fills as 1/10/2571 (ผิด — ควรเป็น 1/10/2570)
```

### After

```
Step 2 — ข้อมูลส่วนตัว
┌──────────────────────────────────────────────────────────────────────┐
│  วันเกิด:   [วว] [ดด] [ปปปป]    วันบรรจุ:  [วว] [ดด] [ปปปป]            │
│                                                                      │
│  📅 วันที่พ้นส่วนราชการ *                                               │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│   │◉ เกษียณ 60 ปี│ │○ ราชการ 25 ปี│ │○ อายุตัว 50ปี│ │○ กำหนดเอง   │ │
│   │  [แนะนำ]      │ │              │ │              │ │             │ │
│   └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
│  (no description sub-text under any option)                          │
│                                                                      │
│  [วว] [ดด] [ปปปป]  ✨ คำนวณอัตโนมัติจากวันเกิด                          │
│                       (+ 1 ปีหากเกิดหลัง 1 ต.ค.)  ← ถูก                │
│                                                                      │
│   [กลับ]                                              [ถัดไป →]        │
└──────────────────────────────────────────────────────────────────────┘

When "อายุตัว 50 ปี" selected with age<50 OR service<10:
  ⚠️ amber warning toast:
     "อายุยังไม่ถึง 50 ปี ณ วันที่เลือก"  -or-  "อายุราชการยังไม่ถึง 10 ปี ณ วันที่เลือก"
  [ถัดไป] disabled

Fix: birthDate = 1/10/2510 → endDate = 1/10/2570 (correct)
     birthDate = 2/10/2510 → endDate = 1/10/2571 (still +1)
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Auto-populated `endDate` for Oct 1 birthdays | `1/10/{birthYear+61}` | `1/10/{birthYear+60}` | Bug fix |
| Auto-populated `endDate` for Oct 2+ birthdays | `1/10/{birthYear+61}` | `1/10/{birthYear+61}` | No change (was correct) |
| Step 2 option count | 3 (`age60`/`service25`/`custom`) | 4 (`age60`/`service25`/`age50`/`custom`) | Type union widened |
| Description sub-text on option pills | Present on all 3 options (line ~191) | Removed from all 4 | UX cleanup per user direction |
| Selecting `age50` | N/A | Sets `retirementOption="age50"`, leaves `endDate` empty | Forces user to pick |
| `endDate` validation while `age50` selected | None (any custom date allowed) | Block `ถัดไป` if `endDate` empty OR `age@endDate<50` OR `serviceYears@endDate<10` | New |
| Helper text under bottom datepicker | `"+ 1 ปีหากเกิดตั้งแต่ 1 ต.ค."` (wrong) | `"+ 1 ปีหากเกิดหลัง 1 ต.ค."` (correct) + new branch for `age50` | |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `lib/calculations.ts` | 71-82 | The function being fixed — current buggy `if (birthMonth >= 9)` |
| P0 | `app/sections/PersonalInfoForm.tsx` | 1-266 | Entire Step 2 component — the one file with the most edits |
| P0 | `types/index.ts` | 70-110 | `FormState` and `retirementOption` union — schema source of truth |
| P1 | `app/page.tsx` | 30-64, 109-225 | `initialForm`, `eligibilityCheck` (existing wizard-level check), `tryGoNextFromStep1` — DO NOT touch but understand |
| P1 | `e2e/smoke.spec.ts` | 1-193 | Existing e2e patterns: `beforeEach`, `addInitScript` for localStorage clear, `getByRole`, `locator` patterns, `placeholder="วว"`/`"ดด"`/`"ปปปป (พ.ศ.)"` selectors |
| P1 | `lib/utils.ts` | 1-100 | `BE_OFFSET = 543`, `toBE`, `formatThaiDate`, `getMostRecentRound` — domain helpers |
| P2 | `CLAUDE.md` | "Domain rules that bite" #2 | The line that needs the doc update |
| P2 | `components/ui/CalendarPickerTH.tsx` | (entire) | Reference only — date picker contract; no edits expected |

## External Documentation

No external research needed — feature uses established internal patterns (Framer Motion option-pill animation already in `PersonalInfoForm.tsx:151-194`, amber `AlertCircle` warning already in `PersonalInfoForm.tsx:200-213`, Playwright e2e flows already in `e2e/smoke.spec.ts`).

---

## Patterns to Mirror

### NAMING_CONVENTION — Retirement options array

```ts
// SOURCE: app/sections/PersonalInfoForm.tsx:19-38
const retirementOptions = [
  {
    value: "age60" as const,
    label: "เกษียณอายุ 60 ปี",
    description: "คำนวณอัตโนมัติจากวันเกิด",   // ← will be removed from render but field can stay
    recommended: true
  },
  {
    value: "service25" as const,
    label: "อายุราชการ 25 ปี",
    description: "คำนวณจากวันบรรจุ + 25 ปี",
    recommended: false
  },
  {
    value: "custom" as const,
    label: "กำหนดเอง",
    description: "เลือกวันที่ด้วยตัวเอง",
    recommended: false
  },
] as const;
```

**Apply**: insert the new entry **between `service25` and `custom`** (matches user's listing order in Q2 reply: `เกษียณอายุ 60 ปี | อายุราชการ 25 ปี | อายุตัว 50 ปี | กำหนดเอง`):
```ts
{
  value: "age50" as const,
  label: "อายุตัว 50 ปี",
  description: "",        // empty — won't render anyway
  recommended: false
},
```

### OPTION_HANDLER — handleRetirementOption pattern

```ts
// SOURCE: app/sections/PersonalInfoForm.tsx:43-68
const handleRetirementOption = (option: FormState["retirementOption"]) => {
  setRetirementWarning("");

  // Validation: require prereq date for auto-calc options
  if (option === "age60" && !form.birthDate) {
    setRetirementWarning("กรุณาเลือกวันเดือนปีเกิดก่อน เพื่อคำนวณวันเกษียณอัตโนมัติ");
    return;
  }
  if (option === "service25" && !form.startDate) {
    setRetirementWarning("กรุณาเลือกวันบรรจุก่อน เพื่อคำนวณวันพ้นราชการอัตโนมัติ");
    return;
  }

  updateForm({ retirementOption: option });

  if (option === "age60" && form.birthDate) {
    const birth = new Date(form.birthDate);
    const retire = calculateRetirementDate(birth);
    updateForm({ endDate: retire.toISOString() });
  } else if (option === "service25" && form.startDate) {
    const start = new Date(form.startDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 25);
    updateForm({ endDate: end.toISOString() });
  }
};
```

**Apply**: add a new branch *before* the second `updateForm` block:
```ts
if (option === "age50" && (!form.birthDate || !form.startDate)) {
  setRetirementWarning("กรุณาเลือกวันเกิดและวันบรรจุก่อน");
  return;
}
```
And after `updateForm({ retirementOption: option })`, do **nothing extra** for `age50` — leave `endDate` as-is (per Q3-b "ปล่อยว่าง"). The user must pick the date manually via the bottom datepicker.

### WARNING_RENDER — Amber AlertCircle toast

```tsx
// SOURCE: app/sections/PersonalInfoForm.tsx:200-213
<AnimatePresence>
  {retirementWarning && (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      role="alert"
      className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm"
    >
      <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-amber-600" />
      <p className="font-medium">{retirementWarning}</p>
    </motion.div>
  )}
</AnimatePresence>
```

**Apply**: render a *second* amber toast for `eligibilityWarning` (computed via `useMemo`, separate from the existing `retirementWarning` state). Same visual + ARIA shape so users can't mistake one for the other in screen readers — copy the JSX block, swap the variable.

### RED_ERROR_RENDER — Red AlertCircle (existing endAfterStart pattern)

```tsx
// SOURCE: app/sections/PersonalInfoForm.tsx:233-243
{!endAfterStart && (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600"
  >
    <AlertCircle size={18} />
    <p className="text-sm font-medium">วันที่พ้นส่วนราชการต้องมากกว่าวันบรรจุ</p>
  </motion.div>
)}
```

**Apply**: choose **amber** (warning) over **red** (error) for `age50` eligibility because the existing red is reserved for invariant violations (`endDate <= startDate`), and eligibility-not-met is a guideable user state, not a violation. Stay consistent with the missing-prereq amber.

### NEXT_BUTTON_GUARD — isValid + endAfterStart

```tsx
// SOURCE: app/sections/PersonalInfoForm.tsx:70-74, 255-262
const isValid = form.birthDate && form.startDate && form.endDate;
const endAfterStart =
  form.startDate && form.endDate
    ? new Date(form.endDate) > new Date(form.startDate)
    : true;

// later:
<Button
  onClick={onNext}
  disabled={!isValid || !endAfterStart}
  ...
/>
```

**Apply**: add `eligibilityWarning === null` (or `passesAge50Eligibility`) as a third condition:
```tsx
disabled={!isValid || !endAfterStart || eligibilityFailsForAge50}
```

### HELPER_TEXT_BRANCH — Bottom datepicker helper

```tsx
// SOURCE: app/sections/PersonalInfoForm.tsx:217-229
<DatePickerTH
  value={form.endDate}
  onChange={(d) => {
    updateForm({ endDate: d, retirementOption: "custom" });
  }}
  helper={
    form.retirementOption === "age60"
      ? "✨ คำนวณอัตโนมัติจากวันเกิด (+ 1 ปีหากเกิดตั้งแต่ 1 ต.ค.)"   // ← fix
      : form.retirementOption === "service25"
      ? "✨ คำนวณอัตโนมัติจากวันบรรจุ + 25 ปี"
      : "กรอกวันที่พ้นส่วนราชการ"
  }
/>
```

**Apply**: rewrite the chained ternary as either a `switch` or a 4-branch chained ternary; see Task 9. Note the `onChange` handler currently force-sets `retirementOption: "custom"` — keep this for both `custom` and `age50` flows (when user picks date via picker after selecting `age50`, the option should stay `age50`, NOT flip to `custom`). **Adjust onChange** to preserve `age50` if it's the active option.

### TEST_STRUCTURE — Playwright e2e

```ts
// SOURCE: e2e/smoke.spec.ts:1-13, 26-92
import { test, expect } from '@playwright/test';

test.describe('Pension Calculator Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('early-retire-form');
      } catch {
        // ignore
      }
    });
  });

  test('completes full 6-step wizard flow ...', async ({ page }) => {
    await page.goto('/');
    // Step 0 — Mode Select
    await page.getByRole('radio', { name: /ไม่เป็นสมาชิก กบข\./ }).click();
    await page.locator('button:has-text("เริ่มคำนวณ")').click();
    await page.waitForTimeout(400);

    // Step 1 — date pickers (always visible, not in popovers)
    const dayInputs = page.locator('[placeholder="วว"]');
    const monthInputs = page.locator('[placeholder="ดด"]');
    const yearInputs = page.locator('[placeholder="ปปปป (พ.ศ.)"]');
    await dayInputs.nth(0).fill('15');
    await monthInputs.nth(0).fill('05');
    await yearInputs.nth(0).fill('2500');
    // ... etc
  });
});
```

**Apply**: new spec `e2e/retirement-rules.spec.ts` (see Task 11) follows the same structure: `beforeEach` clears localStorage, navigates to Step 1 from Step 0, exercises the 4 boundary birth dates, and asserts on the auto-populated `endDate` field via `yearInputs.nth(2).inputValue()`.

### B.E. ↔ C.E. CONVERSION

```ts
// SOURCE: lib/utils.ts:8-16
export const BE_OFFSET = 543;
export function toCE(beYear: number): number { return beYear - BE_OFFSET; }
export function toBE(ceYear: number): number { return ceYear + BE_OFFSET; }
```

**Apply**: in e2e tests, e.g. `birth = 1/10/2510 BE` → fill `[2510]` (the form takes BE), expected `endDate.year (BE) = 2570` (CE 2027). The tests assert on the BE strings the picker exposes.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `lib/calculations.ts` | UPDATE (~5 lines, lines 71-82) | Bug fix in `calculateRetirementDate` |
| `types/index.ts` | UPDATE (1 line, line 75) | Widen `retirementOption` union with `"age50"` |
| `app/sections/PersonalInfoForm.tsx` | UPDATE (~50 lines diff) | Add option, strip description, eligibility validation, helper text |
| `CLAUDE.md` | UPDATE (1 paragraph in "Domain rules" #2) | Doc rot guard |
| `e2e/retirement-rules.spec.ts` | CREATE (~120 lines) | Boundary tests for Oct 1 cutoff + age50 happy/warn paths + description-strip |
| `.claude/PRPs/prds/retirement-options-age50-and-oct1-fix.prd.md` | UPDATE | Mark Phase 0–5 as `in-progress` (or `complete` after PR opens) and link to this plan in `PRP Plan` column |

## NOT Building

- **No `vitest`/`jest`/`node --test` infrastructure.** Project has Playwright-only testing; adding a unit framework is out of scope. All boundary cases for `calculateRetirementDate` are covered by e2e flows that pick "เกษียณอายุ 60 ปี" with each boundary birth date.
- **No `FORM_STATE_SCHEMA_VERSION` bump.** Adding a string-literal member to a union is forward-compatible — existing localStorage states with `age60`/`service25`/`custom` parse without change.
- **No auto-correction of stored `endDate` on hydrate** for users whose previously-saved Oct 1 birth date produced a wrong end date. They'll see the correct value next time they re-click "เกษียณอายุ 60 ปี" or re-edit `birthDate`. (Open Q4 in PRD.)
- **No new design tokens, no new components.** Reuse existing `motion.button`, `Button`, `DatePickerTH`, `AlertCircle` from `lucide-react`.
- **No refactor of `handleRetirementOption` to a handler map.** A 4th branch in the existing if/else chain is the lowest-risk change.
- **No change to `lib/calculations.ts` pension formulas (`calculatePensionNonGfp`/`Gfp`/`Livelihood`).** They consume `endDate` only — the choice of retirement option doesn't affect them.

---

## Step-by-Step Tasks

### Task 0 — Create branch
- **ACTION**: Create and switch to a new feature branch from current `main` HEAD (currently `3ee0b8a`).
- **IMPLEMENT**: `git switch -c feat/retirement-options-age50-and-oct1-fix`
- **MIRROR**: Recent feature branches in git log (`fix(calc):...`, `feat:...`).
- **IMPORTS**: N/A
- **GOTCHA**: Make sure the working tree is clean before branching (the existing untracked `improve-cal.txt` and `test-results/` are in `.gitignore`/safe to ignore; the modified `docs/template *.xlsx` is unrelated and should NOT be staged).
- **VALIDATE**: `git status` shows the new branch active; `git log -1 --oneline` shows `3ee0b8a fix(calc): ignore stale salaryOverrides...`.

### Task 1 — Fix `calculateRetirementDate` boundary
- **ACTION**: Tighten the Oct 1 cutoff in `lib/calculations.ts:71-82`.
- **IMPLEMENT**: Replace the function body. Current:
  ```ts
  // BEFORE (lines 71-82)
  export function calculateRetirementDate(birthDate: Date): Date {
    let retireYear = birthDate.getFullYear() + 60;
    const birthMonth = birthDate.getMonth();
    if (birthMonth >= 9) {
      retireYear += 1;
    }
    return new Date(retireYear, 9, 1);
  }
  ```
  After:
  ```ts
  export function calculateRetirementDate(birthDate: Date): Date {
    let retireYear = birthDate.getFullYear() + 60;
    const birthMonth = birthDate.getMonth(); // 0-based; Oct = 9
    const birthDay = birthDate.getDate();
    // Thai fiscal year runs Oct 1 → Sep 30. Oct 1 is the LAST day of the
    // previous fiscal year, so it does NOT trigger the +1. Only birthdays
    // strictly after Oct 1 (Oct 2 onwards through Dec 31) push retirement
    // by one fiscal year.
    if (birthMonth > 9 || (birthMonth === 9 && birthDay > 1)) {
      retireYear += 1;
    }
    return new Date(retireYear, 9, 1); // Always lands on 1 October
  }
  ```
- **MIRROR**: Same shape as the existing function — pure, no side effects.
- **IMPORTS**: None added.
- **GOTCHA**: `Date.getMonth()` is **0-based** (Jan=0, Oct=9). `Date.getDate()` is **1-based** (1..31). Don't conflate them.
- **VALIDATE**: Mental trace 4 cases:
  - `30/9/2510` → month=8, no branch entered → year=2570 ✓
  - `1/10/2510` → month=9, day=1, `birthDay > 1` is false, no branch → year=2570 ✓ (was 2571 ❌)
  - `2/10/2510` → month=9, day=2, `birthDay > 1` is true → year=2571 ✓
  - `31/10/2510` → month=9, day=31 → year=2571 ✓

### Task 2 — Update CLAUDE.md domain rule #2
- **ACTION**: Rewrite the second bullet under "Domain rules that bite".
- **IMPLEMENT**: Find the line `2. **Retirement age**: 60, **+1 year if born on or after October 1**` and replace with:
  ```
  2. **Retirement age**: 60, **+1 year if born after October 1** (i.e., Oct 2 onwards). Oct 1 itself does NOT trigger +1 — it's the last day of the previous Thai fiscal year. See `calculateRetirementDate`. Don't add other birth-month logic without checking.
  ```
- **MIRROR**: Existing bullet style (markdown numbered list, bold key phrase, single-sentence elaboration, single backtick file ref).
- **GOTCHA**: Leave the surrounding bullets (#1 BE/CE, #3 roundUp10, #4 base selection, etc.) untouched.
- **VALIDATE**: `grep -n "October 1" CLAUDE.md` returns the new wording only (no stale "on or after" references).

### Task 3 — Widen `RetirementOption` union
- **ACTION**: Add `"age50"` to the union in `types/index.ts:75`.
- **IMPLEMENT**:
  ```ts
  // BEFORE: retirementOption: "age60" | "service25" | "custom";
  retirementOption: "age60" | "service25" | "age50" | "custom";
  ```
  Order matches user's Q2 listing.
- **MIRROR**: Adjacent string-literal unions in the file (`mode: "gfp" | "non-gfp" | null`).
- **GOTCHA**: `RetirementOption` re-export at line 107 picks this up automatically — no second edit. Don't bump `FORM_STATE_SCHEMA_VERSION` (line 110); it stays at `2`.
- **VALIDATE**: `npx tsc --noEmit` passes; the new value is now valid in `handleRetirementOption(option)` parameter.

### Task 4 — Add 4th option to `retirementOptions` array
- **ACTION**: Insert the new entry between `service25` and `custom` in `app/sections/PersonalInfoForm.tsx:19-38`.
- **IMPLEMENT**:
  ```ts
  const retirementOptions = [
    { value: "age60" as const, label: "เกษียณอายุ 60 ปี", description: "คำนวณอัตโนมัติจากวันเกิด", recommended: true },
    { value: "service25" as const, label: "อายุราชการ 25 ปี", description: "คำนวณจากวันบรรจุ + 25 ปี", recommended: false },
    { value: "age50" as const, label: "อายุตัว 50 ปี", description: "", recommended: false },
    { value: "custom" as const, label: "กำหนดเอง", description: "เลือกวันที่ด้วยตัวเอง", recommended: false },
  ] as const;
  ```
- **MIRROR**: Existing entry shape — `value as const`, `label`, `description`, `recommended`.
- **GOTCHA**: TypeScript will complain if `description` is omitted from the new entry (it's part of the inferred shape). Use empty string `""`, not `null`/`undefined`. The render path will skip-render empty strings (Task 5).
- **VALIDATE**: After Task 5, the new pill renders with no description sub-text, all 4 visible in the grid (currently `md:grid-cols-3` — see Task 6 about layout).

### Task 5 — Strip description `<p>` rendering
- **ACTION**: Remove the description paragraph from the option-pill render (`PersonalInfoForm.tsx` around line 191).
- **IMPLEMENT**: In the JSX block:
  ```tsx
  // BEFORE (~lines 184-192):
  <div>
    <p className={cn("font-medium text-sm", isSelected ? "text-blue-700" : "text-gray-700")}>
      {opt.label}
    </p>
    <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
  </div>

  // AFTER:
  <div>
    <p className={cn("font-medium text-sm", isSelected ? "text-blue-700" : "text-gray-700")}>
      {opt.label}
    </p>
  </div>
  ```
  Remove the second `<p>` line entirely. Keep the wrapping `<div>` so spacing math doesn't change.
- **MIRROR**: The radio dot + label structure stays identical to lines 171-194; only the description paragraph is removed.
- **GOTCHA**: Don't delete the `description` field from the `retirementOptions` array — it's harmless dead-data and might be re-enabled later. Tailwind v4 source-scanning wouldn't be affected either way. (Or, optionally, drop the field too — the "Could" item in PRD MoSCoW.)
- **VALIDATE**: All 4 option pills render label only when viewed in dev server. e2e test (Task 11) asserts the description string `"คำนวณอัตโนมัติจากวันเกิด"` is NOT present in the document.

### Task 6 — Update grid columns for 4 options
- **ACTION**: Change the option grid from 3 columns to 4 columns at `md:` breakpoint.
- **IMPLEMENT**: At `PersonalInfoForm.tsx:147`:
  ```tsx
  // BEFORE: <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
  ```
  This gives a 1-col mobile, 2-col tablet, 4-col desktop layout — keeps each pill from getting too narrow on mid-size screens.
- **MIRROR**: Tailwind v4 utility-first; no config file. Other grids in the app use `md:grid-cols-{N}` similarly.
- **GOTCHA**: Without grid bump, 4 pills in a 3-col grid wraps awkwardly (3 + 1 alone). Verify visually at 1280px+.
- **VALIDATE**: `npm run dev` → Step 2 shows 4 pills in one row on desktop; 2x2 on tablet; stacked on mobile.

### Task 7 — Add `age50` branch to `handleRetirementOption`
- **ACTION**: Insert a new validation branch at `PersonalInfoForm.tsx:43-68`.
- **IMPLEMENT**: Inside the existing function:
  ```ts
  const handleRetirementOption = (option: FormState["retirementOption"]) => {
    setRetirementWarning("");

    if (option === "age60" && !form.birthDate) {
      setRetirementWarning("กรุณาเลือกวันเดือนปีเกิดก่อน เพื่อคำนวณวันเกษียณอัตโนมัติ");
      return;
    }
    if (option === "service25" && !form.startDate) {
      setRetirementWarning("กรุณาเลือกวันบรรจุก่อน เพื่อคำนวณวันพ้นราชการอัตโนมัติ");
      return;
    }
    // NEW:
    if (option === "age50" && (!form.birthDate || !form.startDate)) {
      setRetirementWarning("กรุณาเลือกวันเกิดและวันบรรจุก่อน เพื่อตรวจสอบสิทธิ์");
      return;
    }

    updateForm({ retirementOption: option });

    if (option === "age60" && form.birthDate) {
      // ... unchanged
    } else if (option === "service25" && form.startDate) {
      // ... unchanged
    }
    // NEW: no auto-fill for age50 (per Q3-b "ปล่อยว่าง")
  };
  ```
- **MIRROR**: Existing branches return-early on missing prereq + the same `setRetirementWarning` pattern.
- **GOTCHA**: Do NOT add an `else if (option === "age50")` block that sets `endDate` — leaving it as-is is the whole point of Q3-b.
- **VALIDATE**: Manual: pick `age50` without dates → amber warning; pick `age50` with both dates set → option toggles, `endDate` unchanged.

### Task 8 — Add eligibility `useMemo`
- **ACTION**: Compute eligibility for the `age50` option inside `PersonalInfoForm` and surface it.
- **IMPLEMENT**: Near the top of the component (after the existing `useState`):
  ```ts
  // Day-precise age at a target date — floor of exact years.
  const ageInYearsAt = (birth: Date, target: Date): number => {
    let age = target.getFullYear() - birth.getFullYear();
    const m = target.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && target.getDate() < birth.getDate())) age--;
    return age;
  };

  const age50Eligibility = useMemo(() => {
    if (form.retirementOption !== "age50") return null;
    if (!form.birthDate || !form.startDate || !form.endDate) return null;
    const birth = new Date(form.birthDate);
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (isNaN(birth.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    const age = ageInYearsAt(birth, end);
    const serviceYears = calculateServicePeriod(start, end, 0).totalYears;
    const ageOk = age >= 50;
    const serviceOk = serviceYears >= 10;
    return {
      age,
      serviceYears,
      ageOk,
      serviceOk,
      ok: ageOk && serviceOk,
      warning: !ageOk
        ? "อายุยังไม่ถึง 50 ปี ณ วันที่เลือก"
        : !serviceOk
          ? "อายุราชการยังไม่ถึง 10 ปี ณ วันที่เลือก"
          : null,
    };
  }, [form.retirementOption, form.birthDate, form.startDate, form.endDate]);
  ```
- **IMPORTS**: Add `useMemo` to the existing `useState` import; add `calculateServicePeriod` to the existing `calculations` import:
  ```ts
  import { useState, useMemo } from "react";
  import { calculateRetirementDate, calculateServicePeriod } from "@/lib/calculations";
  ```
- **MIRROR**: `useMemo` shape used throughout `app/page.tsx` (e.g., `eligibilityCheck` at lines 200-225) — same null-guard + isNaN guard pattern.
- **GOTCHA**: Use `calculateServicePeriod(start, end, 0).totalYears` (with leaveDays=0 default). At Step 2 the user hasn't entered leave days yet (Step 3 is later); `totalYears` is precise enough as-is. Do NOT use `(end.getTime() - start.getTime()) / msPerYear` from `app/page.tsx:213` — that's a coarser approximation, and we want the engine-consistent value here.
- **VALIDATE**: Mental trace:
  - birth=`1/1/2520`, start=`1/1/2545`, end=`1/1/2569` → age=49, service=24 → `age50Eligibility.ok = false`, warning = `"อายุยังไม่ถึง 50 ปี"`
  - birth=`1/1/2515`, start=`1/1/2545`, end=`1/1/2549` → age=54, service=4 → warning = `"อายุราชการยังไม่ถึง 10 ปี"`
  - birth=`1/1/2515`, start=`1/1/2545`, end=`1/1/2570` → age=55, service=25 → `ok=true`, warning=null

### Task 9 — Render eligibility warning + block Next
- **ACTION**: Render the second amber toast and gate the "ถัดไป" button.
- **IMPLEMENT**:
  - Inside the JSX, **after** the existing `retirementWarning` `<AnimatePresence>` block (~line 213), add:
    ```tsx
    <AnimatePresence>
      {age50Eligibility && !age50Eligibility.ok && age50Eligibility.warning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          role="alert"
          className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm"
        >
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-amber-600" />
          <p className="font-medium">{age50Eligibility.warning}</p>
        </motion.div>
      )}
    </AnimatePresence>
    ```
  - Update `isValid` (line 70) to include the age50 check:
    ```ts
    const age50Block = form.retirementOption === "age50" && age50Eligibility !== null && !age50Eligibility.ok;
    const isValid = !!(form.birthDate && form.startDate && form.endDate) && !age50Block;
    ```
    (Keep `endAfterStart` separate — different concern.)
- **MIRROR**: Mirrors the existing amber toast at lines 200-213 exactly.
- **GOTCHA**: When `form.retirementOption !== "age50"` the `age50Eligibility` is `null` → no warning, no block. The check is purely opt-in for the new option.
- **VALIDATE**: With `age50` selected and ineligible dates → "ถัดไป" button disabled; with eligible dates → enabled. Other options unaffected.

### Task 10 — Update bottom datepicker helper text
- **ACTION**: Fix the wrong "ตั้งแต่ 1 ต.ค." text and add a 4th branch for `age50`.
- **IMPLEMENT**: Replace the chained ternary at lines 222-228:
  ```tsx
  // BEFORE:
  helper={
    form.retirementOption === "age60"
      ? "✨ คำนวณอัตโนมัติจากวันเกิด (+ 1 ปีหากเกิดตั้งแต่ 1 ต.ค.)"
      : form.retirementOption === "service25"
      ? "✨ คำนวณอัตโนมัติจากวันบรรจุ + 25 ปี"
      : "กรอกวันที่พ้นส่วนราชการ"
  }

  // AFTER:
  helper={
    form.retirementOption === "age60"
      ? "✨ คำนวณอัตโนมัติจากวันเกิด (+ 1 ปีหากเกิดหลัง 1 ต.ค.)"
      : form.retirementOption === "service25"
      ? "✨ คำนวณอัตโนมัติจากวันบรรจุ + 25 ปี"
      : form.retirementOption === "age50"
      ? "กรอกวันที่พ้นส่วนราชการ (ต้องอายุ 50+ และอายุราชการ 10+ ปี)"
      : "กรอกวันที่พ้นส่วนราชการ"
  }
  ```
- **ALSO**: Update the `onChange` handler one line above (line 220) so picking a date with `age50` selected does NOT flip the option to `custom`:
  ```tsx
  // BEFORE:
  onChange={(d) => {
    updateForm({ endDate: d, retirementOption: "custom" });
  }}

  // AFTER:
  onChange={(d) => {
    // Preserve "age50" selection; otherwise flip to "custom" for free-form date entry.
    const nextOption = form.retirementOption === "age50" ? "age50" : "custom";
    updateForm({ endDate: d, retirementOption: nextOption });
  }}
  ```
- **MIRROR**: Existing onChange contract (positional `d` param, single `updateForm` call).
- **GOTCHA**: The `"+ 1 ปีหากเกิดหลัง 1 ต.ค."` wording is the **public-facing rule**. CLAUDE.md (Task 2) and this string must agree.
- **VALIDATE**: With `age60` → "หลัง" (not "ตั้งแต่"); with `age50` → new helper; with `service25`/`custom` → unchanged.

### Task 11 — Create e2e spec `e2e/retirement-rules.spec.ts`
- **ACTION**: Add a new Playwright spec covering 3 scenarios: Oct 1 boundary, age50 happy path, age50 warn path.
- **IMPLEMENT**: New file:
  ```ts
  import { test, expect } from '@playwright/test';

  // Mirror smoke.spec.ts beforeEach
  test.describe('Retirement rules — Oct 1 cutoff + age50 option', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(() => {
        try { window.localStorage.removeItem('early-retire-form'); } catch {}
      });
    });

    // Helper: skip Step 0 by clicking non-gfp + Continue
    const enterStep1 = async (page: import('@playwright/test').Page) => {
      await page.goto('/');
      await page.getByRole('radio', { name: /ไม่เป็นสมาชิก กบข\./ }).click();
      await page.locator('button:has-text("เริ่มคำนวณ")').click();
      await page.waitForTimeout(400);
    };

    test('birth 1/10/2510 with age60 option → endDate = 1/10/2570', async ({ page }) => {
      await enterStep1(page);
      const day = page.locator('[placeholder="วว"]');
      const month = page.locator('[placeholder="ดด"]');
      const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');
      // Birth date
      await day.nth(0).fill('1');
      await month.nth(0).fill('10');
      await year.nth(0).fill('2510');
      // Start date (any valid before end)
      await day.nth(1).fill('1');
      await month.nth(1).fill('10');
      await year.nth(1).fill('2540');
      // Click "เกษียณอายุ 60 ปี" — auto-fills endDate
      await page.getByRole('button', { name: /เกษียณอายุ 60 ปี/ }).click();
      await page.waitForTimeout(200);
      // Assert auto-populated end date is 1/10/2570 (BE)
      await expect(day.nth(2)).toHaveValue('1');
      await expect(month.nth(2)).toHaveValue('10');
      await expect(year.nth(2)).toHaveValue('2570');
    });

    test('birth 2/10/2510 with age60 option → endDate = 1/10/2571', async ({ page }) => {
      await enterStep1(page);
      const day = page.locator('[placeholder="วว"]');
      const month = page.locator('[placeholder="ดด"]');
      const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');
      await day.nth(0).fill('2');
      await month.nth(0).fill('10');
      await year.nth(0).fill('2510');
      await day.nth(1).fill('1');
      await month.nth(1).fill('10');
      await year.nth(1).fill('2540');
      await page.getByRole('button', { name: /เกษียณอายุ 60 ปี/ }).click();
      await page.waitForTimeout(200);
      await expect(year.nth(2)).toHaveValue('2571');
    });

    test('age50 option requires both prereq dates', async ({ page }) => {
      await enterStep1(page);
      // Click age50 with no dates → amber warning, option not selected
      await page.getByRole('button', { name: /อายุตัว 50 ปี/ }).click();
      await expect(page.locator('text=กรุณาเลือกวันเกิดและวันบรรจุก่อน')).toBeVisible();
    });

    test('age50 happy path: age 55 + service 12 → no warning, can proceed', async ({ page }) => {
      await enterStep1(page);
      const day = page.locator('[placeholder="วว"]');
      const month = page.locator('[placeholder="ดด"]');
      const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');
      // birth 1/1/2515 → age 55 at 1/1/2570
      await day.nth(0).fill('1'); await month.nth(0).fill('1'); await year.nth(0).fill('2515');
      // start 1/1/2545 → 25 yrs at 1/1/2570
      await day.nth(1).fill('1'); await month.nth(1).fill('1'); await year.nth(1).fill('2545');
      // Click age50 (does NOT auto-fill endDate)
      await page.getByRole('button', { name: /อายุตัว 50 ปี/ }).click();
      await page.waitForTimeout(150);
      // Manually pick endDate 1/1/2570
      await day.nth(2).fill('1'); await month.nth(2).fill('1'); await year.nth(2).fill('2570');
      await page.waitForTimeout(150);
      // ถัดไป enabled
      const next = page.locator('button:has-text("ถัดไป")');
      await expect(next).toBeEnabled();
    });

    test('age50 warn path: age 49 → warning + ถัดไป disabled', async ({ page }) => {
      await enterStep1(page);
      const day = page.locator('[placeholder="วว"]');
      const month = page.locator('[placeholder="ดด"]');
      const year = page.locator('[placeholder="ปปปป (พ.ศ.)"]');
      // birth 1/1/2521 → age 49 at 1/1/2570
      await day.nth(0).fill('1'); await month.nth(0).fill('1'); await year.nth(0).fill('2521');
      await day.nth(1).fill('1'); await month.nth(1).fill('1'); await year.nth(1).fill('2545');
      await page.getByRole('button', { name: /อายุตัว 50 ปี/ }).click();
      await page.waitForTimeout(150);
      await day.nth(2).fill('1'); await month.nth(2).fill('1'); await year.nth(2).fill('2570');
      await page.waitForTimeout(150);
      await expect(page.locator('text=อายุยังไม่ถึง 50 ปี')).toBeVisible();
      await expect(page.locator('button:has-text("ถัดไป")')).toBeDisabled();
    });

    test('descriptions are stripped from all 4 option pills', async ({ page }) => {
      await enterStep1(page);
      // The 3 legacy descriptions must not be in the DOM
      await expect(page.locator('text=คำนวณอัตโนมัติจากวันเกิด')).toHaveCount(0);
      await expect(page.locator('text=คำนวณจากวันบรรจุ + 25 ปี')).toHaveCount(0);
      await expect(page.locator('text=เลือกวันที่ด้วยตัวเอง')).toHaveCount(0);
      // The 4 labels are visible
      await expect(page.getByRole('button', { name: /^เกษียณอายุ 60 ปี/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /^อายุราชการ 25 ปี/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /^อายุตัว 50 ปี/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /^กำหนดเอง/ })).toBeVisible();
    });
  });
  ```
- **MIRROR**: `e2e/smoke.spec.ts` `beforeEach`, `addInitScript`, `getByRole`/`locator` patterns.
- **GOTCHA**: 
  - Don't import from `@/lib/calculations` here — Playwright runs in browser context. Test through UI only.
  - The `getByRole('button', { name: /อายุตัว 50 ปี/ })` matcher relies on the option pill being rendered as `<button>` — confirmed via `motion.button` at line 151.
  - The `await page.waitForTimeout(150-200)` mirrors `smoke.spec.ts:34, 57, 61, etc.` — Framer Motion exit animations need a beat to settle even with `reducedMotion: reduce`.
- **VALIDATE**: `npx playwright test e2e/retirement-rules.spec.ts` — all 6 tests green. Intentionally revert Task 1 → boundary tests fail. Revert Task 8 → warn-path test fails.

### Task 12 — Update PRD phase status
- **ACTION**: Mark phases as `in-progress` (or `complete` after merge) in the PRD's Implementation Phases table.
- **IMPLEMENT**: In `.claude/PRPs/prds/retirement-options-age50-and-oct1-fix.prd.md`, edit the table:
  ```
  | 0 | Branch | ... | in-progress | - | - | retirement-options-age50-and-oct1-fix.plan.md |
  | 1 | Bug fix + docs | ... | in-progress | with 2 | 0 | retirement-options-age50-and-oct1-fix.plan.md |
  ... etc
  ```
- **MIRROR**: PRD's existing table format.
- **GOTCHA**: Don't lose other PRD content; surgical edit only the Status + PRP Plan columns.
- **VALIDATE**: `git diff .claude/PRPs/prds/retirement-options-age50-and-oct1-fix.prd.md` shows only those columns changed.

### Task 13 — Run CI gate locally
- **ACTION**: Execute the same 4 commands the GitHub Actions CI runs.
- **IMPLEMENT**:
  ```bash
  npm run lint
  npx tsc --noEmit
  npm run build
  npx playwright test
  ```
- **MIRROR**: `.github/workflows/ci.yml` (per CLAUDE.md "CI gate is: lint → tsc --noEmit → next build → playwright test").
- **GOTCHA**: The Tailwind v4 source-scan picks up class-name-shaped strings from any text file including this plan and the PRD. Avoid literal arbitrary-value classes containing bare ellipses in any markdown (CLAUDE.md gotcha — caused dev-server crashes in PR #2 and #8).
- **VALIDATE**: All 4 commands exit 0.

### Task 14 — Open PR
- **ACTION**: Push branch, open PR.
- **IMPLEMENT**:
  ```bash
  git push -u origin feat/retirement-options-age50-and-oct1-fix
  gh pr create --title "feat(step2): age50 option + fix Oct 1 retirement cutoff" --body "$(cat <<'EOF'
  ## Summary
  - Fix `calculateRetirementDate` so birthdays on Oct 1 retire at age 60 (was incorrectly +1 year)
  - Add 4th Step 2 option **"อายุตัว 50 ปี"** with age ≥ 50 + service ≥ 10 eligibility validation
  - Strip description sub-text from all 4 retirement option pills (uniform UX per user direction)

  ## Test plan
  - [ ] `npm run lint` clean
  - [ ] `npx tsc --noEmit` clean
  - [ ] `npm run build` succeeds
  - [ ] `npx playwright test` — existing smoke + new `e2e/retirement-rules.spec.ts` all green
  - [ ] Manual: birth 1/10/2510 + age60 → end 1/10/2570 ✓
  - [ ] Manual: birth 2/10/2510 + age60 → end 1/10/2571 ✓
  - [ ] Manual: age50 with age 49 dates → amber warning, ถัดไป disabled
  - [ ] Manual: age50 with age 55 + 12 yrs service → no warning, ถัดไป enabled

  Refs PRD `.claude/PRPs/prds/retirement-options-age50-and-oct1-fix.prd.md`.
  EOF
  )"
  ```
- **MIRROR**: PR title style from recent commits — `feat(scope):` and `fix(scope):` patterns visible in `git log`.
- **GOTCHA**: User instruction in CLAUDE.md (`Co-Authored-By` is disabled globally) — don't add Anthropic attribution.
- **VALIDATE**: PR URL returned; CI starts automatically and goes green.

---

## Testing Strategy

### Unit Tests
**N/A — project has no unit-test framework installed.** All boundary cases are covered by Playwright e2e tests via UI flows that exercise `calculateRetirementDate` indirectly through the auto-populated `endDate` after picking "เกษียณอายุ 60 ปี" with each boundary birth date.

### E2E Tests (in `e2e/retirement-rules.spec.ts`)

| # | Scenario | Input | Expected Output | Edge Case? |
|---|---|---|---|---|
| 1 | Oct 1 boundary | birth=1/10/2510, age60 selected | endDate auto-fills 1/10/**2570** | ✓ Boundary |
| 2 | Oct 2 boundary | birth=2/10/2510, age60 selected | endDate auto-fills 1/10/**2571** | ✓ Boundary |
| 3 | age50 prereq missing | Click age50 with no dates | Amber `"กรุณาเลือกวันเกิดและวันบรรจุก่อน"` | ✓ Validation |
| 4 | age50 happy | age=55, service=25 at chosen end | No warning, ถัดไป enabled | Happy path |
| 5 | age50 warn (age) | age=49, service=25 | Warning `"อายุยังไม่ถึง 50 ปี"`, ถัดไป disabled | ✓ Validation |
| 6 | Description-strip | All 4 pills | None of the 3 legacy description strings present in DOM | UX assertion |

### Edge Cases Checklist
- [x] Empty input → handled by existing `birthDate ?? null` checks
- [x] Date in the future → endDate validation blocks via `endAfterStart`
- [x] Leap-year birthdays (Feb 29) → `ageInYearsAt` handles via month/day comparison; not a boundary case for Oct 1
- [x] Same birth + start date → service = 0 → age50 fails service check (correct)
- [x] localStorage with stale `endDate` from old buggy calc → user re-clicks age60 to recompute (Open Q4 in PRD)

---

## Validation Commands

### Static Analysis
```bash
npm run lint
```
EXPECT: Zero ESLint errors. (Project uses `next/core-web-vitals` + `next/typescript`.)

```bash
npx tsc --noEmit
```
EXPECT: Zero type errors. The new `"age50"` literal must be assignable everywhere `RetirementOption` is referenced.

### Build
```bash
npm run build
```
EXPECT: `next build` succeeds. Watch for Tailwind v4 source-scan crashes from class-name-shaped strings in any text file (CLAUDE.md gotcha — production build silently drops bad rules but dev red).

### E2E Tests
```bash
npx playwright test
```
EXPECT: All existing smoke tests still green (no regression) + 6 new tests in `e2e/retirement-rules.spec.ts` green.

```bash
npx playwright test e2e/retirement-rules.spec.ts
```
EXPECT: 6/6 green when run in isolation.

```bash
npx playwright show-report
```
For triaging any failures.

### Manual Validation Checklist
- [ ] `npm run dev`, navigate to Step 2, see 4 option pills (no description sub-text on any)
- [ ] Pick `age50` with no dates → amber warning visible
- [ ] Pick `age50` with both dates set → option toggles, `endDate` stays unchanged
- [ ] Manually pick `endDate` via the bottom datepicker → `retirementOption` stays `age50` (not flipped to `custom`)
- [ ] Set ineligible dates (e.g., age 49) → amber `"อายุยังไม่ถึง 50 ปี"` toast, "ถัดไป" button disabled
- [ ] Set eligible dates (e.g., age 55 + service 12) → no warning, "ถัดไป" enabled
- [ ] Pick `age60` with `birthDate=1/10/2510` → `endDate` shows 1/10/2570 (not 2571)
- [ ] Pick `age60` with `birthDate=2/10/2510` → `endDate` shows 1/10/2571
- [ ] Helper text under bottom datepicker reads `"+ 1 ปีหากเกิดหลัง 1 ต.ค."` (not `"ตั้งแต่"`)
- [ ] CLAUDE.md domain rule #2 reads "after October 1" (not "on or after")

---

## Acceptance Criteria
- [ ] All 14 tasks completed in order
- [ ] All validation commands pass (`lint`, `tsc`, `build`, `playwright`)
- [ ] 6 new e2e tests passing in `e2e/retirement-rules.spec.ts`
- [ ] Existing 5 e2e tests in `smoke.spec.ts` still passing (no regression)
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Step 2 visually matches the "After" UX diagram (4 pills, no descriptions, age50 between service25 and custom)
- [ ] PR opened with correct summary + test plan

## Completion Checklist
- [ ] Code follows discovered patterns (motion.button option pill, amber AlertCircle warning, useMemo eligibility, Playwright `[placeholder="..."]` selectors)
- [ ] Error handling matches codebase style (`setRetirementWarning` early-returns + amber toast for warnings; red toast reserved for invariant violations)
- [ ] Test patterns match `smoke.spec.ts` (beforeEach, reducedMotion, localStorage clear, getByRole/locator with placeholder selectors)
- [ ] No hardcoded values that don't already exist (50, 10, 60 are domain constants; OK to inline)
- [ ] Documentation updated: CLAUDE.md domain rule #2, PRD phase status
- [ ] No unnecessary scope additions (no vitest, no schema bump, no auto-correction on hydrate)
- [ ] Self-contained — no questions needed during implementation

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Grid layout breaks at 4 pills (md:grid-cols-3 → wrap awkwardly) | M | Visual | Task 6 changes to `md:grid-cols-2 lg:grid-cols-4`. Verify at 1024px (tablet 2x2) and 1280px+ (desktop 4 in row) |
| Playwright tests flake on Framer Motion entry/exit (timing) | M | CI | Mirror `smoke.spec.ts` `await page.waitForTimeout(150-400)` after each option-click and date-fill |
| Existing localStorage with stale `endDate` for Oct 1 born users keeps showing wrong value | M | UX silent | Documented in PRD Open Question #4. Default: do nothing on hydrate; helper text invites re-selection |
| Helper-text wording changes pick up Tailwind class-shaped tokens (e.g., literal `[1ต.ค.]` if mis-typed) | L | Build crash | Avoid square-bracket arbitrary syntax in Thai strings (use parens) — already followed; verify `npm run dev` after Task 10 |
| `description: ""` triggers TS error if the array is read elsewhere expecting non-empty | L | Type | Empty string is still `string`; type-check catches if anything required `description.length > 0` |
| Refactor of `onChange` (Task 10b) accidentally breaks `custom` flow | L | UX | Test path: pick `custom` then change date → option stays `custom` ✓ |
| Forgetting to add `"age50"` to a future analytics/logging dispatch elsewhere | L | Telemetry | Project has no analytics layer — N/A |

## Notes
- **Why bundle all 6 PRD phases into one plan**: the changes are tightly coupled (eligibility logic depends on the new option existing; the option's helper text depends on the bug fix wording; tests depend on all of it landing). The PRD's phase split was for parallelism estimation, not for separate PRs. One PR, one CI run, one review pass is more efficient at this scope.
- **Decision: e2e-only testing** — adding `vitest` would mean: new devDep, `vitest.config.ts`, `tsconfig.json` adjustments (vitest types), updating CI workflow, and the cognitive overhead of two test runners. Not worth it for ~5 boundary cases that e2e covers cleanly.
- **Why preserve `description` field but not render it**: leaves the option-array shape intact for future re-enabling. The "Could" item in PRD MoSCoW (drop the field) is deferred — no functional benefit, only tidiness.
- **The existing `eligibilityCheck` in `app/page.tsx:200-225` is wizard-level (gating Step 1→2)** and complements but does not subsume the new option-level check. The wizard-level check warns about lump-sum eligibility (service < 10); the option-level check enforces the *strict* rule for `age50` (age ≥ 50 AND service ≥ 10). They're independent guards.
- **Order of operations after merge**: Phase 4 cleanup item (deleting the legacy `description` field, optionally) can ship in a follow-up if desired.

---

*Generated: 2026-05-03*
*Source: `.claude/PRPs/prds/retirement-options-age50-and-oct1-fix.prd.md`*
*Confidence Score: 9/10 — single-pass implementable; main risk is grid layout breakage which is visually verifiable in dev*
