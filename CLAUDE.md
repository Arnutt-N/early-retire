# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> A more exhaustive Thai-language reference exists in **`AGENTS.md`** (data shapes, every formula, full component map). Read it before doing anything non-trivial to the calculation engine or the salary table.

## Project

**Early Retire** — A Thai-language pension/gratuity calculator for civil servants of the Office of the Permanent Secretary, Ministry of Justice. Users walk through a 5-step wizard and the app computes both pension cases side-by-side:

- **non-gfp** (not a GPF/กบข. member) — based on the **last month's salary**
- **gfp** (GPF member) — based on the **average of the last 60 months**

The output is monthly pension, lump-sum gratuity, and a 3-installment "บำเหน็จดำรงชีพ" (livelihood gratuity).

There is **no backend, no database, no auth**. All data is static JSON; all state is client-side and auto-saved to `localStorage`.

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

The entire application state is a single `FormState` object held in `useState` at `app/page.tsx`. Step components are presentational and receive `{ form, updateForm, onNext, onBack }` props.

- `updateForm(partial)` does a shallow merge **and** writes the full state to `localStorage` under the key `early-retire-form` on every call. State is rehydrated on mount (with SSR guard for `typeof window`).
- All derived values — `servicePeriod`, `salaryRecords`, `lastSalary`, `avg60Months`, `nonGfpResult`, `gfpResult`, `nonGfpLivelihood`, `gfpLivelihood` — are chained `useMemo` calls in `page.tsx`. **Don't compute results inside step components.** New results that need to be displayed in `ResultSection` must be derived in `page.tsx` and threaded through props.
- The wizard renders `steps[step]` from an array — adding/reordering a step means editing both this array and the `currentStep`-aware `ProgressBar`.

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
2. **Retirement age**: 60, **+1 year if born on or after October 1** (Thai fiscal-year convention). See `calculateRetirementDate`. Don't add other birth-month logic without checking.
3. **Salary increase rounding**: raw increase is rounded **up to the nearest 10** via `roundUp10` (`Math.ceil(value / 10) * 10`). Not nearest, not floor — up.
4. **Base selection in `generateSalaryTable`**: if `salary <= baseMid` use `baseBottom`, otherwise `baseTop`. Then `actualIncrease = roundUp10(base × percent / 100)`. New salary clamps at `fullSalary`.
5. **GFP monthly cap**: `monthly = min(avg60 × years / 50, avg60 × 0.70)`. The 70% cap is the binding constraint for long-serving members.
6. **Livelihood (`calculateLivelihood`)**: total = `monthly × 15`, paid in **3 rounds** at ages 60 / 65 / 70 with per-round caps (`200k / 200k / unlimited` for non-GFP, `200k / 200k / 100k` for GFP). Remainders cascade — round 2 starts from `total - round1`, etc.
7. **GFP table window**: `generateSalaryTable` with `mode="gfp"` walks back 60 months from `endDate` and caps at ~10 six-month periods. `mode="non-gfp"` walks forward from `assessmentDate` to `endDate`.

## Conventions and gotchas

- **All interactive components are Client Components** (`"use client"` at top). Only `app/layout.tsx` is server. Don't try to use `localStorage` / `window` / `document` from a Server Component.
- **Type duplication**: `PensionResult` and `SalaryRecord` are defined in **both** `types/index.ts` and `lib/calculations.ts`. They differ — e.g., `SalaryRecord.level` is `number` in `types/` but `string` in `lib/`, and `actualIncrease` only exists in the `lib/` version. The `lib/` definitions are what runs; keep both in sync when editing or prefer the `lib/` import for new code that touches calculations.
- **Tailwind CSS v4** is configured via `@import "tailwindcss"` and `@theme inline` blocks in `app/globals.css`. There is **no `tailwind.config.js`** — don't create one. Custom design tokens are CSS variables on `:root` (e.g., `--color-primary: #1e3a5f`). Use `cn()` from `lib/utils.ts` (clsx + tailwind-merge) to compose class strings.
- **Icons**: only `lucide-react`. Don't pull in another icon set.
- **Animations**: Framer Motion. There is no `prefers-reduced-motion` opt-out in components — Playwright tests rely on `page.emulateMedia({ reducedMotion: 'reduce' })` to stabilize wizard transitions, so don't gate test logic on motion-completion events.
- **`app/page.tsx.bak`** exists in the working tree — it is a stale backup, not part of the build. Don't reference it.
- **`docs/`** is excluded from ESLint and may contain working notes / Excel templates that drove the original formulas — useful when someone questions a calculation rule.

## When extending the calculator

- New input field → add to `FormState` in `types/index.ts`, default in `initialForm` in `app/page.tsx`, render in the appropriate step under `app/sections/`, and (if it affects results) feed it into the right `useMemo` chain in `page.tsx`.
- New formula → add a pure function to `lib/calculations.ts`, write the math there (not in components), and expose only the result type the UI needs.
- New step → extend the `steps` array in `page.tsx`, update `ProgressBar` (`components/ProgressBar.tsx`), and update the e2e flow in `e2e/smoke.spec.ts`.
- Salary base / position / rule change → edit the JSON in `data/`. The build will pick it up; no codegen.
