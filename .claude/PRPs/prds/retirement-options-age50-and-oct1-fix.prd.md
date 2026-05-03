# Retirement Rules Fix — Oct 1 Cutoff + อายุตัว 50 ปี Option

**Branch (proposed)**: `feat/retirement-options-age50-and-oct1-fix`
**Source branch**: `main` @ `3ee0b8a`
**Owner**: arnutt.n@gmail.com
**Generated**: 2026-05-03

---

## Problem Statement

The early-retire calculator has two correctness gaps in Step 2 ("ข้อมูลส่วนตัว"):

1. **Wrong fiscal-year cutoff for retirement age.** Anyone born on **1 October** is currently treated as if their retirement is delayed by one year (age 61), which is incorrect under Thai government fiscal-year convention. Only those born **2 October onwards** should retire one year later. Today the calculator over-charges those Oct-1-born users by an entire fiscal year of "wrong end date" → wrong service period → wrong pension.

2. **No first-class option for early-resignation (ลาออกก่อนเกษียณ) at age 50.** Users who plan to leave the service at 50+ with at least 10 years of accrued service must currently choose "กำหนดเอง" and remember the eligibility threshold themselves. There's no in-app guard or signal that this is the canonical "early retirement at 50" path.

A separate UX cleanup ships in the same branch: per user direction, the descriptive sub-text under every option in the "วันที่พ้นส่วนราชการ" section is removed for visual consistency.

## Evidence

- **Bug source (verified):** `lib/calculations.ts:71-82` — the conditional `if (birthMonth >= 9)` (October = month index 9) fires for *any* day in October. The `>=` should be `>` against day 1, not the month boundary.
- **Stale doc (verified):** `app/sections/PersonalInfoForm.tsx:224` — helper text reads `"+ 1 ปีหากเกิดตั้งแต่ 1 ต.ค."`, which echoes the wrong rule.
- **Stale doc (verified):** `CLAUDE.md` "Domain rules that bite" item #2 says *"+1 year if born on or after October 1"* — same wrong rule.
- **Domain ask (validated by user, 2026-05-03):** Births of `1/10/พ.ศ.` retire `1/10/พ.ศ.+60`; births of `2/10/พ.ศ.` retire `1/10/พ.ศ.+61`.
- **Step 2 current options (verified):** `PersonalInfoForm.tsx:19-38` has only `age60`, `service25`, `custom`. No age-50 path. Each entry currently carries a `description` field rendered at line 191.
- **User direction on description text (verbatim):** `"ทุกตัวเลือก ไม่ต้องมีคำอธิบายใต้รายการ ครับ"` — applies to all 4 options.

## Proposed Solution

A single feature branch that ships three correctness/UX changes together:

1. **Bug fix.** Tighten `calculateRetirementDate` so only birth month/day strictly **after** Oct 1 trigger the +1-year fiscal adjustment. Update the in-UI helper text and the CLAUDE.md domain rule to match.
2. **New Step 2 option.** Add a fourth option **"อายุตัว 50 ปี"** that sets `retirementOption = "age50"` but **does not** auto-populate `endDate` — the user is forced to pick their target end date manually via the existing CalendarPickerTH datepicker. Eligibility at the chosen `endDate` is validated (age ≥ 50 AND service ≥ 10 years) with the same amber-warning UX as the existing "missing prereq date" warnings.
3. **UX cleanup.** Remove the `description` sub-text from every option in the section (uniform: just label and radio dot).

The approach reuses the existing `retirementOptions` array, the existing amber `AlertCircle` warning component, and the existing `calculateServicePeriod` helper — no new component primitives needed.

## Key Hypothesis

We believe **(a)** correcting the Oct 1 cutoff and **(b)** giving early-resignation-at-50 a guarded first-class option in Step 2 will eliminate two recurring sources of wrong-end-date inputs for civil servants who are evaluating early retirement. The description-strip is a stylistic decision the user owns; success there is purely visual conformance.

We'll know we're right when:
- All birth dates in `{1/10/พ.ศ., 2/10/พ.ศ., 30/9/พ.ศ., 31/10/พ.ศ.}` produce retirement dates matching the table in [Decisions Log](#decisions-log).
- A user picking "อายุตัว 50 ปี" with `birthDate` + `startDate` set, then a chosen `endDate`, sees a warning if and only if (`age@endDate < 50`) OR (`serviceYears@endDate < 10`).
- All four option pills render only the label (no gray sub-text underneath).

## What We're NOT Building

- **Re-architecting the eligibility model** — no eligibility engine or rule DSL; the new option uses inline conditions in `PersonalInfoForm`.
- **Other early-retirement schemes** (e.g., service ≥ 25 + age < 50) — out of scope; the user explicitly defined the rule as `age ≥ 50 AND service ≥ 10`.
- **Changing how `result` / `livelihood` are computed downstream** — the calculation engine (`lib/calculations.ts` pension/livelihood functions) is unaffected by the choice of retirement option; it consumes `endDate` only.
- **Schema migration / FORM_STATE_SCHEMA_VERSION bump** — adding a string-literal member to the `retirementOption` union is forward-compatible with existing localStorage state. Saved states with old values (`age60`/`service25`/`custom`) remain valid.
- **Description sub-text under any option** — explicitly stripped from all four per user direction.
- **"แนะนำ" badge for the new option** — the gold "แนะนำ" pill stays only on `age60` (existing); the new option is not promoted.

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Oct 1 retirement-date accuracy | 4/4 boundary cases correct | Unit test in `lib/__tests__/calculations.test.ts` (or e2e equivalent) covering `{30/9, 1/10, 2/10, 31/10}` × representative birth years |
| New option appears in Step 2 | Visible + selectable | E2E test in `e2e/smoke.spec.ts` clicks the 4th option |
| Eligibility warning fires correctly | 100% of bad inputs warned | E2E negative tests: age < 50 → warn; service < 10 → warn; both pass → no warn |
| Description-strip applied uniformly | 0 description paragraphs rendered in section | E2E assert: `getByRole("button", { name: /เกษียณอายุ 60 ปี/ })` does not contain known description string `"คำนวณอัตโนมัติจากวันเกิด"` |
| No regression on existing options | All current e2e green | `npx playwright test` baseline still green |
| Type check + lint clean | 0 errors | `npx tsc --noEmit` + `npm run lint` |

## Open Questions

- [ ] **Service-years computation at Step 2** — should the eligibility check use `calculateServicePeriod(start, end, 0).totalYears` (consistent with the engine, ignores not-yet-entered leave days), or a simple year-diff? **Default chosen**: `calculateServicePeriod(start, end, 0).totalYears`, which is precise and matches the rest of the calculator. Confirm or override at planning time.
- [ ] **Age-50 precision** — the user said `Q1: a+b`, which I read as "≥50 at the chosen `endDate`, day-level precision (i.e., user must have already turned 50 by `endDate`)". Implementation: `endDate >= addYears(birthDate, 50)` with day-of-month + month logic mirroring `calculateRetirementDate`. Confirm.
- [ ] **What happens after the user picks "อายุตัว 50 ปี" but the eligibility fails?** Per Q2 the user wants a warning when a date isn't picked at all; eligibility-fail path wasn't explicitly answered. **Default chosen**: same amber-toast pattern, message `"อายุยังไม่ถึง 50 ปี / อายุราชการยังไม่ถึง 10 ปี ณ วันที่เลือก"`, and `isValid` blocks the "ถัดไป" button until satisfied (matching the existing `endAfterStart` block at line 257).
- [ ] **Existing-state correction on hydrate** — should we run a one-shot recomputation of `endDate` for stored sessions whose `retirementOption === "age60"` and `birthDate` falls on Oct 1, or rely on the user re-selecting? **Default chosen**: do nothing on hydrate; the corrected helper text invites re-selection if the user notices.

---

## Users & Context

**Primary User**

- **Who**: A Ministry of Justice civil servant in their late 40s / early 50s, considering ลาออกก่อนเกษียณ.
- **Current behavior**: Opens calculator → Step 2 → either picks "เกษียณอายุ 60 ปี" and gets the wrong end date if born Oct 1, or picks "กำหนดเอง" and types a date that may silently fail their actual eligibility.
- **Trigger**: Wants a quick "what would I get if I left at 52 with 18 years of service?" answer before talking to HR.
- **Success state**: Picks the option that says exactly what they're considering, types or picks the target end date, immediately knows whether they qualify, and sees the lump-sum / monthly / livelihood numbers without leaving Step 2 with a wrong assumption baked in.

**Job to Be Done**
When **I'm planning whether to leave service before age 60**, I want **the calculator to recognize "early retirement at 50+" as a first-class path and reject ineligible end dates up front**, so I can **trust the result rather than second-guess it**.

**Non-Users**
- Officers planning regular age-60 retirement who don't need the new option.
- Officers under 50 with < 10 years' service — they're not eligible and the warning will tell them so; they're not the target of the feature.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Fix `calculateRetirementDate` so only birth dates **strictly after Oct 1** add +1 year | Bug; affects the most-used `age60` path |
| Must | Add `"age50"` to `RetirementOption` union in `types/index.ts:75` | Type-safety prerequisite for the new option |
| Must | Add the 4th option button in `PersonalInfoForm.tsx` (label `"อายุตัว 50 ปี"`, no description, not recommended) | Primary feature |
| Must | Strip the rendered description `<p>` in the option pill so all 4 options show label only | User direction (uniform UX) |
| Must | When `"age50"` is selected: do not auto-populate `endDate`; show warning if `birthDate` or `startDate` missing | Per Q3 (b) and Q2 |
| Must | Eligibility validation at the chosen `endDate`: amber warning when age < 50 OR service < 10 | Per Q1 + open question 3 |
| Must | Update CLAUDE.md domain rule #2 + `PersonalInfoForm.tsx:224` helper text to reflect the corrected rule | Doc rot guard |
| Should | Unit tests for `calculateRetirementDate` covering 30/9, 1/10, 2/10, 31/10 boundaries | Lock the bug fix |
| Should | E2E coverage for the new "อายุตัว 50 ปี" path including warning states + description-strip | Confirms the UX wiring |
| Could | Refactor `handleRetirementOption` switch to a small per-option handler map | Lower priority cleanup; optional |
| Could | Drop the `description` field from the `retirementOptions` array entirely (not just stop rendering it) | Tidier; can defer if scope risk |
| Won't | Bump `FORM_STATE_SCHEMA_VERSION` | Change is forward-compatible |
| Won't | Mark the new option `recommended: true` | User direction |
| Won't | Render the existing descriptions for the 3 legacy options | User direction |

### MVP Scope

The minimum to ship:
1. `calculateRetirementDate` fixed.
2. `RetirementOption` union widened to include `"age50"`.
3. `PersonalInfoForm` renders the new option, refuses to auto-fill `endDate`, validates eligibility at the chosen `endDate`, and blocks "ถัดไป" until valid.
4. The description `<p>` (line 191 area) is removed/skipped so no option shows description text.
5. Helper text + CLAUDE.md updated.

### User Flow — "อายุตัว 50 ปี" path

1. User enters `birthDate` and `startDate` in the top card.
2. User clicks the 4th option **"อายุตัว 50 ปี"**.
3. If either prereq date is missing → amber toast `"กรุณาเลือกวันเกิดและวันบรรจุก่อน"`, option not selected.
4. Otherwise → `retirementOption = "age50"`, `endDate` left as-is (or empty); helper text below the bottom datepicker switches to `"กรอกวันที่พ้นส่วนราชการ (ต้องอายุ 50+ และอายุราชการ 10+ ปี)"`.
5. User picks `endDate` via CalendarPickerTH.
6. Validation: if `endDate` empty OR `age@endDate < 50` OR `serviceYears@endDate < 10` → amber warning + "ถัดไป" disabled.
7. When all green → "ถัดไป" enables; rest of the wizard is unchanged.

### User Flow — Bug fix path (no UI change)

1. Existing user with `birthDate = 1/10/2510` and `retirementOption = "age60"` opens the app.
2. localStorage hydrates as before.
3. `calculateRetirementDate` (now corrected) recomputes the helper-driven `endDate` only when the user re-clicks "เกษียณอายุ 60 ปี" or re-edits `birthDate`. Until then, the previously persisted `endDate` (possibly wrong) stays.
4. Mitigation: log the discrepancy (optional) or simply rely on user re-selecting. **Decision**: do not auto-correct stored `endDate` for users with existing state; the corrected helper text invites them to re-select if they care. (See Open Question #4.)

---

## Technical Approach

**Feasibility**: HIGH — both changes touch a tiny surface area, no new dependencies.

**Architecture Notes**

- **Bug fix scope** (`lib/calculations.ts:71-82`):
  - Replace `if (birthMonth >= 9)` with a stricter check: `if (birthMonth > 9 || (birthMonth === 9 && birthDay > 1))`.
  - Or refactor to a clearer named predicate `bornAfterOct1(birthDate)` co-located in the file.
- **Type widening** (`types/index.ts:75`): `retirementOption: "age60" | "service25" | "age50" | "custom"`. Re-export `RetirementOption` already at line 107 picks this up automatically.
- **Step 2 UI** (`app/sections/PersonalInfoForm.tsx`):
  - Extend `retirementOptions` with the new entry.
  - **Remove the `<p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>` line (~line 191) so descriptions never render**, regardless of whether the field is present in the array. Optionally drop the field too (the "Could" item above).
  - Extend `handleRetirementOption` with the `age50` branch.
  - Compute `eligibilityWarning` inside the component using `useMemo` based on `form.birthDate`, `form.startDate`, `form.endDate`, `form.retirementOption`.
  - Block `isValid` when option is `"age50"` and eligibility fails.
- **Helper text** (`PersonalInfoForm.tsx:222-228`): add a 4th branch for `"age50"`; reword the `"age60"` branch to `"+ 1 ปีหากเกิดหลัง 1 ต.ค."` (or `"+ 1 ปีหากเกิดตั้งแต่ 2 ต.ค."`).
- **CLAUDE.md** Domain rules section: rewrite item #2 to match the corrected rule and add a one-liner about the new `age50` option.

**Day-level age-50 check** — implementation sketch (open for review at planning):
```ts
function ageAtDateYears(birth: Date, target: Date): number {
  let years = target.getFullYear() - birth.getFullYear();
  const m = target.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && target.getDate() < birth.getDate())) years--;
  return years;
}
// eligibility: ageAtDateYears(birth, end) >= 50
//              calculateServicePeriod(start, end, 0).totalYears >= 10
```

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tailwind v4 source-scan picks up a stray ellipsis-like literal in this PRD or new helper text → dev-server crash | L | Avoid literal arbitrary-value class names with `...` in any text (CLAUDE.md gotcha) |
| Existing localStorage state with `endDate` computed under the old (buggy) rule keeps showing wrong end date for Oct-1-born users until they reselect | M | Optional: add a one-shot recomputation on hydrate gated by schema version. Default: do nothing, rely on user reselect. Decide at planning. |
| Off-by-one in `ageAtDateYears` (leap years, Feb 29 birthdays) | L | Unit-test boundary cases; reuse the same shape as existing `calculateServicePeriod` math |
| Removing description rendering accidentally breaks layout (vertical rhythm, button height) | L | Keep button padding the same; visually confirm 4 options align in the grid |
| Snapshot/visual e2e tests asserting on the description string | L | Search and update any e2e selectors that target description text |

---

## Implementation Phases

<!--
  STATUS: pending | complete | complete
  PARALLEL: phases that can run concurrently (e.g., "with 3" or "-")
  DEPENDS: phases that must complete first (e.g., "1, 2" or "-")
  PRP: link to generated plan file once created
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 0 | Branch | Create `feat/retirement-options-age50-and-oct1-fix` from `main` | complete | - | - | [`retirement-options-age50-and-oct1-fix.plan.md`](../plans/completed/retirement-options-age50-and-oct1-fix.plan.md) |
| 1 | Bug fix + docs | Correct `calculateRetirementDate`, update `PersonalInfoForm` helper text, update CLAUDE.md rule #2 | complete | with 2 | 0 | [`retirement-options-age50-and-oct1-fix.plan.md`](../plans/completed/retirement-options-age50-and-oct1-fix.plan.md) |
| 2 | New option type + UI cleanup | Widen `retirementOption` union, add 4th option button, **strip description `<p>` for all 4 options**, wire `handleRetirementOption` for `age50` (no auto endDate) | complete | with 1 | 0 | [`retirement-options-age50-and-oct1-fix.plan.md`](../plans/completed/retirement-options-age50-and-oct1-fix.plan.md) |
| 3 | Eligibility validation | `useMemo` eligibility computation, amber-warning rendering, `isValid` block for `age50` path, helper-text branch for `age50` | complete | - | 2 | [`retirement-options-age50-and-oct1-fix.plan.md`](../plans/completed/retirement-options-age50-and-oct1-fix.plan.md) |
| 4 | Tests | E2E boundary tests (no unit framework available) for `calculateRetirementDate` + new option happy/warn paths + description-strip assertion | complete | - | 1, 3 | [`retirement-options-age50-and-oct1-fix.plan.md`](../plans/completed/retirement-options-age50-and-oct1-fix.plan.md) |
| 5 | Verify + PR | `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npx playwright test`, open PR with summary referencing this PRD | complete | - | 4 | [`retirement-options-age50-and-oct1-fix.plan.md`](../plans/completed/retirement-options-age50-and-oct1-fix.plan.md) |

### Phase Details

**Phase 0: Branch**
- **Goal**: Isolate this work from `main`.
- **Scope**: `git switch -c feat/retirement-options-age50-and-oct1-fix` from current `main` head.
- **Success signal**: Branch exists, working tree carries this PRD as the first commit (or kept in working tree until Phase 5).

**Phase 1: Bug fix + docs**
- **Goal**: Restore correct fiscal-year cutoff and align documentation.
- **Scope**: `lib/calculations.ts:71-82`, `app/sections/PersonalInfoForm.tsx:224`, `CLAUDE.md` domain rule #2.
- **Success signal**: Manually-stepped boundary cases produce the correct retirement years; helper text + CLAUDE.md read consistently.

**Phase 2: New option type + UI cleanup**
- **Goal**: Surface "อายุตัว 50 ปี" as a selectable Step 2 option with the agreed UX (label only) AND strip descriptions from every option.
- **Scope**: `types/index.ts:75`, `app/sections/PersonalInfoForm.tsx:19-38`, the description `<p>` render around line 191, and `handleRetirementOption`.
- **Success signal**: Clicking the new option toggles selection without populating `endDate`; **none** of the 4 options renders any sub-text under the label.

**Phase 3: Eligibility validation**
- **Goal**: Block ineligible inputs and surface clear warnings.
- **Scope**: New `eligibilityWarning` `useMemo`, amber `AlertCircle` reuse, helper-text branch, `isValid` block.
- **Success signal**: Manual probe: age 49.99 → warn; age 50 + service 9.5 → warn; age 50 + service 10 → no warn, "ถัดไป" enables.

**Phase 4: Tests**
- **Goal**: Lock the fix and the new option against future regression.
- **Scope**: New unit tests in (whichever pattern the project already uses; if none, lightweight inline test or e2e-only); extend `e2e/smoke.spec.ts` with the new path and a description-strip assertion.
- **Success signal**: All tests green; new tests intentionally fail when the bug or option is reverted.

**Phase 5: Verify + PR**
- **Goal**: Ship-ready state.
- **Scope**: Run the CI gate locally (lint → tsc → build → playwright), open PR with checklist.
- **Success signal**: PR opened, CI green, ready for merge.

### Parallelism Notes

Phases 1 and 2 touch disjoint files (mostly) and can be done concurrently by a single contributor or two parallel sub-agents. Phase 3 depends on Phase 2 (needs the new option to validate against). Phase 4 depends on both 1 and 3 having landed so tests cover the final state.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Cutoff predicate | "Born after Oct 1" (strictly > 1/10) | "Born on/after Oct 1" (status quo, buggy) | User clarification: 1/10 → +60, 2/10 → +61 |
| New option label | `"อายุตัว 50 ปี"` | `"ลาออกก่อนเกษียณ"`, `"พ้นจากราชการ"` | User picked this exact wording |
| Description sub-text | Removed for all 4 options | Add description to new option only / keep all | User direction: `"ทุกตัวเลือก ไม่ต้องมีคำอธิบายใต้รายการ"` |
| New option `recommended` | False | True (gold "แนะนำ" badge) | User direction: `"ไม่แนะนำ"` |
| `endDate` on selecting new option | Leave as-is / empty | Auto-populate to today, or to min eligible date | User picked Q3-(b): "ปล่อยว่าง" |
| Schema version | Stay at 2 | Bump to 3 | Adding union member is forward-compatible; old states still parse |
| Eligibility blocking | Amber warning + "ถัดไป" disabled | Allow proceed with warning only | Matches existing `endAfterStart` block UX |
| Service-years source | `calculateServicePeriod(start, end, 0).totalYears` | Simple `(end-start)/365.25` | Consistency with the rest of the engine |

### Boundary table — expected retirement dates after the fix

| Birth date (พ.ศ.) | Current (buggy) end date | Correct end date | Reason |
|---|---|---|---|
| `30/9/2510` | `1/10/2570` | `1/10/2570` | Born before Oct, +60 → 2570 ✓ |
| `1/10/2510` | `1/10/2571` ❌ | `1/10/2570` | Oct 1 is fiscal-year-end of FY2570, no +1 |
| `2/10/2510` | `1/10/2571` | `1/10/2571` | Born after Oct 1, +1 → 2571 ✓ |
| `31/10/2510` | `1/10/2571` | `1/10/2571` | Born late Oct, +1 → 2571 ✓ |

---

## Research Summary

**Codebase Context**
- `app/page.tsx` holds the entire `FormState`; `retirementOption` lives there and is threaded into `PersonalInfoForm`. No backend / API.
- `lib/calculations.ts` is the only calc surface; pure functions, easy to unit-test.
- Tailwind v4 + Framer Motion + reduced-motion conventions all already in place; no new tooling needed.
- E2E suite is Playwright (`e2e/smoke.spec.ts`); CI gate is `lint → tsc → build → playwright`.
- Sibling PRD `early-retire-redesign.prd.md` covered the prior 6-step wizard redesign (out of scope for this PRD).

**Domain Context**
- Thai government fiscal year runs Oct 1 → Sep 30. Anyone whose age-60 fiscal year ends on the day they would be exactly 60-1-day or earlier should retire at the start of *that* fiscal year (Oct 1 = same year). The Oct-1-born case is the boundary that's currently misclassified.
- The "อายุตัว 50 ปี" rule (age 50+ AND service 10+) is the user's organization's rule for ลาออกก่อนเกษียณ eligibility being checked at this UI level. Pension formulas downstream don't change.

---

*Generated: 2026-05-03*
*Status: DRAFT — awaiting confirmation of Open Questions, then `/prp-plan` for Phase 1*
