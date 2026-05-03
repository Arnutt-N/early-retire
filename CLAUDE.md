# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> A more exhaustive Thai-language reference exists in **`AGENTS.md`** (data shapes, every formula, full component map). Read it before doing anything non-trivial to the calculation engine or the salary table.

## Project

**Early Retire** — A Thai-language pension/gratuity calculator for civil servants of the Office of the Permanent Secretary, Ministry of Justice. Mobile-first **6-step wizard** with mode-first flow (post-redesign):

1. **เลือกประเภท** — Mode Select (กบข. / non-กบข.) — gates the rest of the wizard
2. **ข้อมูลส่วนตัว** — birth date, start date, retirement date (3 options + datepicker override)
3. **เวลาราชการ** — service period summary, multiplier periods (conditional), leave-day deductions (now actually subtracted)
4. **ประวัติเลื่อนเงินเดือน** — current salary, latest assessment date, 6 rounds of % history
5. **การคำนวณ** — editable per-row salary table (level dropdown + วันที่มีผล CalendarPickerTH + % override per row)
6. **ผลลัพธ์** — all 3 amounts (lumpSum + monthly + livelihood 3-round) for the chosen mode + disclaimer

Mode determines the formula:
- **non-gfp** — based on the last month's salary
- **gfp** — based on the average of the last 60 months, capped at 70% × avg

There is **no backend, no database, no auth**. All data is static JSON; all state is client-side and auto-saved to `localStorage` with schema-version migration (silent clear on `__schemaVersion` mismatch).

## Commands

```bash
npm run dev              # Next.js dev server on :3000
npm run build            # Production build
npm run start            # Run production build (must build first)
npm run lint             # ESLint (next/core-web-vitals + next/typescript)
npx tsc --noEmit         # Type check (no script alias; CI runs it directly)
npx playwright test      # Run E2E suite (auto-starts dev server)
npx playwright test e2e/smoke.spec.ts -g "wizard flow"   # Single test by title
npx playwright show-report   # View HTML report after a run
```

CI (`.github/workflows/ci.yml`) gate is: `lint` → `tsc --noEmit` → `next build` → `playwright test` (chromium only). All four must pass.

## Architecture

### State lives in one place: `app/page.tsx`

The entire application state is a single `FormState` object held in `useState` at `app/page.tsx`. Step components are presentational and receive `{ form, updateForm, onNext, onBack }` props (Step 0 only takes `onNext`; final step only takes `onBack`).

- `updateForm(partial)` does a shallow merge **and** writes the full state to `localStorage` under the key `early-retire-form` on every call. The merged state always carries `__schemaVersion: FORM_STATE_SCHEMA_VERSION` so the loader can recognize stale shapes.
- On mount, `loadInitialForm()` reads localStorage; if `__schemaVersion` is missing or doesn't match the current constant, it **silently clears** the entry and returns `initialForm`. This is the migration strategy — bump the version constant in `types/index.ts` whenever the shape changes incompatibly.
- All derived values are chained `useMemo` calls in `page.tsx`:
  - `totalLeaveDays = sickLeaveDays + personalLeaveDays + vacationDays`
  - `servicePeriod` (`calculateServicePeriod(start, end, totalLeaveDays)`)
  - `salaryRecords` (`generateSalaryTable(currentSalary, defaultLevel, ..., mode, salaryBases, salaryOverrides)`)
  - `lastSalary`, `avg60Months` (derived from salaryRecords)
  - `result` — single mode-aware pension computation (no longer "compute both, toggle on results page")
  - `livelihood` — single mode-aware livelihood
- **Don't compute results inside step components.** Derive in `page.tsx`, thread via props.
- The wizard renders `steps[step]` from a 6-element array. The Step 0 ModeSelect button is disabled until `form.mode !== null` — that's the mode-gating mechanism.

### Data layer = three JSON files in `data/`

Imported directly via `import x from "@/data/..."` (enabled by `resolveJsonModule`). No fetch, no API.

- `salary-bases.json` — per-level pay bases (`fullSalary`, `baseTop`, `baseBottom`, `baseMid`)
- `position-map.json` — position name → level per career track (general / academic / admin / management)
- `rules.json` — retirement rules, multiplier periods, pension formulas

### Calculation engine: `lib/calculations.ts`

Pure functions (no React). The five public entry points are `calculateRetirementDate`, `calculateServicePeriod`, `calculatePensionNonGfp`, `calculatePensionGfp`, `calculateLivelihood`, and `generateSalaryTable`. **All pension math goes here, not in components.**

### Path alias

`@/*` resolves to repo root (`tsconfig.json`). Use `@/lib/...`, `@/components/...`, `@/data/...`, `@/types`.

## Domain rules that bite

These are pension-domain quirks that show up across the codebase. Follow the existing helpers — don't reinvent them.

1. **Buddhist Era (พ.ศ.) ↔ Common Era**: offset is **543**. Always use `toBE(ce)` / `toCE(be)` from `lib/utils.ts`. Never inline `+ 543` elsewhere. UI displays B.E.; logic and ISO strings use C.E.
2. **Retirement age**: 60, **+1 year if born after October 1** (i.e., Oct 2 onwards). Oct 1 itself does NOT trigger +1 — it's the last day of the previous Thai fiscal year. See `calculateRetirementDate`. Don't add other birth-month logic without checking. Related: `calculateAge50EligibilityDate(birth, start)` returns the earliest end-of-service date satisfying age ≥ 50 AND service ≥ 10 — used by the "อายุ 50 ปี ขึ้นไป" Step 2 option.
3. **Salary increase rounding**: raw increase is rounded **up to the nearest 10** via `roundUp10` (`Math.ceil(value / 10) * 10`). Not nearest, not floor — up.
4. **Base selection in `generateSalaryTable`**: if `salary <= baseMid` use `baseBottom`, otherwise `baseTop`. Then `actualIncrease = roundUp10(base × percent / 100)`. New salary clamps at `fullSalary`.
5. **GFP monthly cap**: `monthly = min(avg60 × years / 50, avg60 × 0.70)`. The 70% cap is the binding constraint for long-serving members.
6. **Livelihood (`calculateLivelihood`)**: total = `monthly × 15`, paid in **3 rounds** at ages 60 / 65 / 70 with per-round caps (`200k / 200k / unlimited` for non-GFP, `200k / 200k / 100k` for GFP). Remainders cascade — round 2 starts from `total - round1`, etc.
7. **GFP table window**: `generateSalaryTable` with `mode="gfp"` walks back 60 months from `endDate` and caps at ~10 six-month periods. `mode="non-gfp"` walks forward from `assessmentDate` to `endDate`.

## Conventions and gotchas

- **All interactive components are Client Components** (`"use client"` at top). Only `app/layout.tsx` is server. Don't try to use `localStorage` / `window` / `document` from a Server Component.
- **Type duplication** (still present, deferred cleanup): `PensionResult` and `SalaryRecord` are defined in **both** `types/index.ts` and `lib/calculations.ts`. After Phase 1, `SalaryRecord.level` is `string` in **both** and `SalaryOverride` is in both with identical shape (`effectiveDate` + `level` + `percent`). The `lib/` definitions are what runs at the boundary of `generateSalaryTable`; the `types/` versions are imported by sections that re-export `FormState`. Keep both in sync when editing.
- **Tailwind CSS v4** is configured via `@import "tailwindcss"` and `@theme inline` blocks in `app/globals.css`. There is **no `tailwind.config.js`** — don't create one. Custom design tokens are CSS variables on `:root` (calm-fintech: `--gradient-mesh-primary`, `--ease-out-expo`, `--shadow-e1..e4`, `--surface-data`, `--duration-fast`, etc.). Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) to compose class strings.
- **Tailwind v4 source-scanning gotcha**: it picks up class-name-shaped strings from **any text file in the project**, including `.md` plans and notes. Don't write literal arbitrary-value classes containing a bare ellipsis in docs — Tailwind generates a CSS rule whose value is also `...`, which fails PostCSS parsing and crashes the dev server (production build silently drops it, hence build green / dev red). Use concrete placeholders like `var(--TOKEN)` (with a real-looking but undefined variable name) instead. We hit this twice on the redesign loop (PR #2 and PR #8); see the fixes in those PRs.
- **Icons**: only `lucide-react`. Don't pull in another icon set.
- **Framer Motion + reduced-motion**: CSS `@media (prefers-reduced-motion: reduce)` in `globals.css` disables CSS transitions but **does NOT reach Framer's JS animations** (`whileTap`, `whileHover`, `animate()`). Components that animate via Framer must use `useReducedMotion()` to disable explicitly. See `Button.tsx`, `Card.tsx`, `SegmentedControl.tsx`, `AnimatedNumber.tsx` for the pattern.
- **DatePicker**: the canonical component is `components/ui/CalendarPickerTH.tsx` (calendar overlay popover with พ.ศ. + always-visible keyboard inputs). `components/DatePickerTH.tsx` is a re-export shim left for backward compat — Phase 4 cleanup will delete it after all consumers migrate to the direct path. **Do not edit DatePickerTH.tsx**; edit the new file.
- **Legacy `FormState` fields** marked `@deprecated`: `position`, `levelCategory`, `viewMode`. These remain optional in the type for backward compat — the redesign no longer uses them, but Phase 4 cleanup hasn't deleted them yet. Don't read them in new code; use `mode` (top-level) instead of `viewMode`.
- **`docs/`** is excluded from ESLint and contains the original Excel template that drives the calculation formulas — useful when someone questions a number.

## When extending the calculator

- New input field → add to `FormState` in `types/index.ts`, default in `initialForm` in `app/page.tsx`, render in the appropriate step under `app/sections/`, and (if it affects results) feed it into the right `useMemo` chain in `page.tsx`. **If the field changes the shape incompatibly, bump `FORM_STATE_SCHEMA_VERSION` in `types/index.ts` so existing localStorage gets cleared on next visit.**
- New formula → add a pure function to `lib/calculations.ts`, write the math there (not in components), and expose only the result type the UI needs.
- New step → extend the `steps` array in `page.tsx`, update `ProgressBar` (`components/ProgressBar.tsx` — currently 6 labels), and update the e2e flow in `e2e/smoke.spec.ts`.
- Salary base / position / rule change → edit the JSON in `data/`. The build will pick it up; no codegen.
- **Per-row table editability** — the salary table at Step 4 supports per-row overrides via `FormState.salaryOverrides[idx]`. Each override entry carries `{ effectiveDate, level, percent }` (any null = use computed default). When user edits row N, set `salaryOverrides[N]` (extend array if shorter). `generateSalaryTable` consumes them. Known limitation: overrides index into records by position, so changing inputs that shift the record set (e.g., `endDate`) can leave overrides pointing at the wrong row — clear the affected entries when you detect this.
