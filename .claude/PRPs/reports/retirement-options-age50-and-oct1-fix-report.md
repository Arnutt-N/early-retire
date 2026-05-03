# Implementation Report: Retirement Rules — Oct 1 Cutoff + อายุตัว 50 ปี

## Summary
Fixed the `calculateRetirementDate` Oct 1 boundary bug (1/10 birthdays no longer get +1 fiscal year), added a 4th Step 2 retirement option **"อายุตัว 50 ปี"** with age ≥ 50 + service ≥ 10 inline eligibility validation, and stripped the description sub-text from all 4 option pills per user direction. Six new e2e tests cover the behavior; CI gate (lint, tsc, build, playwright) is green.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Small (~5 source files, ~250 lines) | Small (5 source + 1 doc + 1 new e2e = 7 files, ~280 lines diff) |
| Confidence | 9/10 | Verified accurate. The only iteration loop was on e2e test mechanics (picker `onChange` fires on blur, not on `fill()`). |
| Files Changed | 7 (per plan) | 7 |
| Tests | 6 new e2e | 6 new e2e — all passing |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 0 | Create branch `feat/retirement-options-age50-and-oct1-fix` | ✅ Complete | Branched from `main` @ `3ee0b8a` |
| 1 | Fix `calculateRetirementDate` boundary | ✅ Complete | `lib/calculations.ts:71-86` |
| 2 | Update CLAUDE.md domain rule #2 | ✅ Complete | "born after October 1" wording |
| 3 | Widen `RetirementOption` union | ✅ Complete | Added `"age50"` to `types/index.ts:75` |
| 4 | Add 4th option to `retirementOptions` array | ✅ Complete | Inserted between `service25` and `custom` |
| 5 | Strip description `<p>` from option pills | ✅ Complete | Removed render line; `description` field retained as harmless dead-data |
| 6 | Update grid columns 3 → 2/4 responsive | ✅ Complete | `md:grid-cols-2 lg:grid-cols-4` |
| 7 | Add `age50` branch in `handleRetirementOption` | ✅ Complete | Validates birthDate + startDate; no auto-fill of endDate |
| 8 | Add `age50Eligibility` `useMemo` + `ageInYearsAt` helper | ✅ Complete | Day-precise age calc; uses `calculateServicePeriod(...).totalYears` |
| 9 | Render eligibility warning + block "ถัดไป" via `age50Block` | ✅ Complete | Mirrors existing amber `AlertCircle` toast |
| 10 | Update bottom datepicker helper text + onChange | ✅ Complete | "หลัง 1 ต.ค." wording fix; preserves `age50` on manual date pick |
| 11 | Create `e2e/retirement-rules.spec.ts` | ✅ Complete | 6 tests; deviated from plan — see Deviations |
| 12 | Update PRD phase statuses → complete | ✅ Complete | All 6 phases marked complete |
| 13 | Run CI gate locally | ✅ Complete | All 4 gates green |
| 14 | Push + open PR | ⏸️ **Paused — awaits user confirmation** | Push/PR are shared-state actions |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (`npx tsc --noEmit`) | ✅ Pass | Zero type errors |
| Lint (`npm run lint`) | ✅ Pass | Zero ESLint errors |
| Build (`npm run build`) | ✅ Pass | `next build` clean, ~73s compile |
| E2E (`npx playwright test`) | ✅ Pass | **11/11 tests** (5 existing smoke + 6 new retirement-rules) |
| Edge cases | ✅ Pass | 4 boundary birth dates, 3 eligibility scenarios, description-strip assertion |

## Files Changed

| File | Action | Lines |
|---|---|---|
| `lib/calculations.ts` | UPDATED | +9 / -4 (function body rewrite for boundary fix) |
| `types/index.ts` | UPDATED | +1 / -1 (union widened) |
| `app/sections/PersonalInfoForm.tsx` | UPDATED | +89 / -19 (option add, description strip, eligibility, helper text, onChange) |
| `CLAUDE.md` | UPDATED | +1 / -1 (domain rule #2 wording) |
| `e2e/retirement-rules.spec.ts` | CREATED | +207 (6 tests) |
| `.claude/PRPs/prds/retirement-options-age50-and-oct1-fix.prd.md` | UPDATED | +6 / -6 (status → complete, plan link → completed/) |
| `.claude/PRPs/plans/completed/retirement-options-age50-and-oct1-fix.plan.md` | MOVED | Archived from `plans/` |
| `.claude/PRPs/reports/retirement-options-age50-and-oct1-fix-report.md` | CREATED | This file |

## Deviations from Plan

**1. e2e Tests 4 + 5 — switched from picker-`fill()` to localStorage pre-seed**

- **WHAT**: The plan called for `await day.fill('1'); await month.fill('1'); await year.fill('2570');` to set the end date in tests for `age50` happy / warn paths.
- **WHY**: `CalendarPickerTH.tsx:198-204` only fires `onChange` from inside `handleBlur` — which checks `containerRef.current?.contains(document.activeElement)` after a 100ms debounce. Playwright's `fill()` doesn't dispatch a real blur event, and Tab keeps focus on the picker's calendar button (also inside `containerRef`), so `onChange` never fired and `form.endDate` stayed `null`. Tried `el.blur()` evaluate, `page.locator('h1').click()`, none reliably propagated.
- **CHANGED TO**: Both tests now pre-seed the full `FormState` in `localStorage` via `addInitScript` (override pattern from `smoke.spec.ts:172-191`), bypass Step 0 by including `mode: 'non-gfp'`, advance to Step 1, and assert directly on the rendered eligibility output. This is a *better* test because it isolates the eligibility-compute + render path from picker UX mechanics.
- **OTHER e2e tests unchanged**: Tests 1, 2 (boundary) work via the `age60` button which calls `updateForm({ endDate: ... })` programmatically. Tests 3 (prereq missing) and 6 (description-strip) don't need date entry. So only 2 of 6 tests use the seed pattern.

**2. e2e Test 1 — assertion values padded to width 2**

- **WHAT**: Plan asserted `day.toHaveValue('1')` and `month.toHaveValue('10')`.
- **WHY**: `partsFrom` in `CalendarPickerTH.tsx:62-63` zero-pads day/month to width 2 via `padStart(2, "0")`. Actual rendered value is `'01'` not `'1'`.
- **CHANGED TO**: Asserted `day.toHaveValue('01')` with a comment pointing to the source line.

**3. e2e Test 6 — `getByText` with `{ exact: true }` to disambiguate from helper text**

- **WHAT**: Plan asserted `page.locator('text=คำนวณอัตโนมัติจากวันเกิด').toHaveCount(0)`.
- **WHY**: Default `text=` is substring match. The bottom datepicker helper text is `"✨ คำนวณอัตโนมัติจากวันเกิด (+ 1 ปีหากเกิดหลัง 1 ต.ค.)"` — contains the description string as a substring → assertion failed with `count=1` instead of `0`.
- **CHANGED TO**: `page.getByText('...', { exact: true })` matches elements whose **full** text content equals the value; helper text doesn't match because it has an extra suffix.

**4. e2e Test 6 — accessible-name regex anchors removed**

- **WHAT**: Plan used `name: /^เกษียณอายุ 60 ปี/`.
- **WHY**: The age60 pill carries a "แนะนำ" badge (Sparkles + Thai text) whose accessible name comes first in the concatenated label. `^` anchor wouldn't match.
- **CHANGED TO**: Removed `^` anchor — substring match instead, with a comment explaining the badge prefix.

## Issues Encountered

**Picker `onChange` fires only on blur out of container**: Spent ~30 minutes diagnosing why test 5 (`age50` warn) failed even after `el.blur()` and `h1.click()` workarounds. Root cause was `CalendarPickerTH.tsx:198` checking focus AFTER a 100ms `setTimeout` — Playwright's `fill()` and even `evaluate(el.blur)` didn't reliably propagate React's synthetic blur. Solved by switching to `localStorage` pre-seed pattern (already documented in `smoke.spec.ts:172` for the legacy-clear test).

**No issue with the production code itself** — all 3 failures were e2e test-mechanic issues. The bug fix and feature work is correct and verified.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `e2e/retirement-rules.spec.ts` | 6 | Oct 1 boundary (1/10 → +60, 2/10 → +61), age50 prereq guard, age50 happy path (no warning), age50 warn path (age 49 → warning + ถัดไป disabled), description-strip |

## Next Steps

- [ ] **Push branch + open PR** — needs user confirmation before executing `git push -u origin feat/retirement-options-age50-and-oct1-fix && gh pr create ...`
- [ ] (Optional) Run `/code-review` to review changes before push
- [ ] (Optional) Manual UX check at 1024px / 1280px+ to verify the 4-pill grid layout reads well
