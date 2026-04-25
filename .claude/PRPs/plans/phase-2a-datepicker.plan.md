# Plan: Phase 2A — DatePickerTH Rewrite

## Summary

Replace the current `components/DatePickerTH.tsx` (3 separate text inputs for วว/ดด/ปปปป) with a calendar overlay popover (`components/ui/CalendarPickerTH.tsx`) that lets users tap a day on a Buddhist-Era calendar grid OR fall back to keyboard input. **API-compatible** with existing `DatePickerTH` so call sites in `PersonalInfoForm` keep working as a drop-in upgrade. Phase 2A runs **in parallel with Phase 2B** (UI primitives) — both depend only on Phase 1.

## User Story

As an older civil-servant entering a date on mobile,
I want a calendar I can tap with my thumb (or type into if I prefer),
so that I don't have to mentally convert พ.ศ. ↔ ค.ศ. or worry about typing day-out-of-range errors.

## Problem → Solution

**Current state**: `DatePickerTH` has 3 narrow text fields. Validation is range-only (`day 1-31`, `month 1-12`, `year 2400-2600`) — no calendar awareness, so "31 ก.พ. 2520" passes the field validator but `parseThaiDate` produces an invalid date silently. No visual feedback for what day-of-week the date falls on, no Thai month names, no quick navigation. Cognitive load is high for a 50+ user typing on mobile.

**Desired state**: Trigger button shows formatted Thai date (or placeholder). Tap → popover with year/month navigation in พ.ศ. + day grid in Thai. Day clicks immediately commit and close. Keyboard fallback (the existing 3-input pattern) is exposed below the grid for power-users / typing speed. Calendar respects `prefers-reduced-motion`. Same `value: ISO string | null` API so swap-in is mechanical.

## Metadata

- **Complexity**: Medium-Large (1 new file, ~300–400 lines, intricate state + a11y considerations)
- **Source PRD**: `.claude/PRPs/prds/early-retire-redesign.prd.md`
- **PRD Phase**: Phase 2A — DatePickerTH Rewrite
- **Estimated Files**: 2 (1 new, 1 deprecated-not-deleted)
- **Time-box**: 2 hours (per PRD)
- **Strategy**: **Drop-in replacement** — same prop API, swap import path

---

## UX Design

### Before
```
┌────────────────────────────────┐
│ วันเกิด *                      │
│ ┌────┐ / ┌────┐ / ┌──────────┐ │
│ │ วว │   │ ดด │   │ปปปป(พ.ศ.)│ │
│ └────┘   └────┘   └──────────┘ │
│ กรอก วว/ดด/ปปปป (พ.ศ.)         │
└────────────────────────────────┘
3 narrow inputs. Type-only. No visual context.
```

### After
```
┌────────────────────────────────┐
│ วันเกิด *                      │
│ ┌────────────────────────────┐ │
│ │ 📅  15 พ.ค. 2500          ▼│ │
│ └────────────────────────────┘ │
│ (click ↓ shows popover)        │
└────────────────────────────────┘
┌────────────────────────────────┐
│  ‹  พฤษภาคม 2500  ›            │
│ ┌──┬──┬──┬──┬──┬──┬──┐         │
│ │จ │อ │พ │พฤ│ศ │ส │อา│         │
│ ├──┼──┼──┼──┼──┼──┼──┤         │
│ │  │  │  │ 1│ 2│ 3│ 4│         │
│ │ 5│ 6│ 7│ 8│ 9│10│11│         │
│ │12│13│14│15│16│17│18│ ← 15 hi │
│ │19│20│21│22│23│24│25│         │
│ │26│27│28│29│30│31│  │         │
│ └──┴──┴──┴──┴──┴──┴──┘         │
│ ─────────────────────────      │
│ พิมพ์: ┌──┐/┌──┐/┌────┐         │
│       │วว│  │ดด│  │ปปปป│        │
│       └──┘  └──┘  └────┘        │
└────────────────────────────────┘
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Open picker | N/A — always inline | Tap trigger button | Button shows current value or placeholder |
| Pick a date | Type 3 fields | Tap calendar day OR type 3 fields | Calendar default; keyboard fallback always present |
| Navigate months | Re-type year + month | Tap ‹ › arrows; year click → year picker | Faster for moving between months |
| Validate | After all 3 fields filled | Calendar disables invalid days; typed input still validated | Visual prevents invalid selection |
| Reduced motion | Animations played | Animations disabled (popover snaps in) | WCAG 2.3.3 |
| Focus management | Tab through 3 inputs | Tab into trigger → enter opens → arrow keys navigate grid → enter selects | Keyboard a11y |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `components/DatePickerTH.tsx` | 1–164 | Existing prop API to preserve; existing validation rules to keep |
| P0 | `lib/utils.ts` | 8–55 | `BE_OFFSET`, `toBE`, `toCE`, `parseThaiDate`, `formatThaiDate`, `daysInMonth` — reuse all |
| P0 | `app/sections/PersonalInfoForm.tsx` | 56–107 | Three call sites that need to keep working |
| P0 | `app/globals.css` | (Phase 1 additions) | Use `--ease-out-expo`, `--shadow-e3`, `--surface-glass-chrome`, `--duration-fast` from Phase 1 |
| P1 | `.claude/PRPs/plans/phase-1-foundation.plan.md` | full | Foundation tokens reference |
| P1 | `components/ui/Button.tsx` | full (Phase 2B may modify) | Trigger button styling pattern |
| P1 | `app/sections/ServicePeriodForm.tsx` | 95–106 | Currently uses `<Input type="date">` for multiplier dates — Phase 3 swaps to CalendarPickerTH; ensure API supports it |
| P2 | `CLAUDE.md` | "Buddhist Era" rule + DatePicker note | B.E./C.E. invariants |
| P2 | `AGENTS.md` | section 5.5 "Date Handling" | Convention reference |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Framer Motion AnimatePresence | https://www.framer.com/motion/animate-presence/ | Wrap conditional popover; `mode="wait"` for clean exit |
| ARIA combobox / dialog pattern | https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ | Date picker is "dialog with combobox trigger" — follow `aria-expanded`, `aria-controls`, `role="dialog"` |
| Click-outside detection in React 19 | https://react.dev/reference/react-dom/createPortal | Use a click-outside hook + Portal optional (popover can be inline if z-index sufficient) |
| Thai month names (short) | (cultural reference) | ม.ค., ก.พ., มี.ค., เม.ย., พ.ค., มิ.ย., ก.ค., ส.ค., ก.ย., ต.ค., พ.ย., ธ.ค. |
| Thai weekday names (short, Mon-start) | (cultural reference) | จ., อ., พ., พฤ., ศ., ส., อา. |

---

## Patterns to Mirror

### COMPONENT_FILE_HEADER
```typescript
// SOURCE: components/DatePickerTH.tsx:1-14
"use client";

import { useRef, useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { parseThaiDate, toBE } from "@/lib/utils";

interface DatePickerTHProps {
  label?: string;
  value: string | null; // ISO date string
  onChange: (isoDate: string | null) => void;
  error?: string;
  helper?: string;
  required?: boolean;
}
```
- `"use client"` at top (interactive)
- Lucide for icons (NOT another icon library)
- Props interface named `{ComponentName}Props`
- Comment ISO format on `value` field
- Reuse helpers from `@/lib/utils`

### POPOVER_WITH_FRAMER
The codebase doesn't have an existing popover/modal. Create a new pattern. Follow Framer's standard:
```typescript
// NEW PATTERN (no existing source — establish it here):
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute z-50 ..."
      role="dialog"
      aria-label="เลือกวันที่"
    >
      {/* calendar content */}
    </motion.div>
  )}
</AnimatePresence>
```
- Easing values: use the cubic-bezier from Phase 1's `--ease-out-expo` token. Inline as `[0.16, 1, 0.3, 1]` because Framer's `ease` accepts arrays of cubic-bezier control points
- `role="dialog"` + `aria-label` for screen readers
- `prefers-reduced-motion` is auto-honored by Phase 1's CSS override (Framer's transition still runs but the wildcard `transition-duration: 0.01ms` rule overrides it)

### TAILWIND_CLASS_COMPOSITION
```typescript
// SOURCE: components/DatePickerTH.tsx:117-125
className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-center focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]"
```
- `rounded-xl` for inputs/buttons (consistent throughout app)
- `border-2 border-gray-200` for default; focus replaces with `--primary`
- `focus:ring-2 focus:ring-[var(--primary-light)]` for the visible focus ring
- Use `cn()` from `lib/utils.ts` when conditional classes are needed: `import { cn } from "@/lib/utils"`

### KEYBOARD_INPUT_VALIDATION
```typescript
// SOURCE: components/DatePickerTH.tsx:97-103
const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
  const el = e.currentTarget;
  const clean = el.value.replace(/\D/g, "");
  const maxLen = el.placeholder === "ปปปป (พ.ศ.)" ? 4 : 2;
  el.value = clean.slice(0, maxLen);
  validateAndUpdate();
};
```
- Strip non-digits aggressively (`replace(/\D/g, "")`)
- Truncate to maxlen based on placeholder context
- Validate on every keystroke (not on blur)
- Reuse this exact handler in the new component's keyboard section

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `components/ui/CalendarPickerTH.tsx` | CREATE | New calendar overlay component, primary deliverable |
| `components/DatePickerTH.tsx` | UPDATE — re-export only | Replace body with `export { default } from "./ui/CalendarPickerTH"` to keep existing imports working without touching `PersonalInfoForm.tsx` (Phase 3 will retarget directly) |

## NOT Building

- **Multi-date / range selection** — single date only
- **Time picker** — date only
- **Date range constraints** (`min`/`max` props) — defer to Phase 3 if needed (likely not — domain dates are open-ended)
- **Locale switching** — Thai only, hardcoded
- **Year picker drill-down** — Phase 2A targets ‹ › month nav + ‹‹ ›› year nav buttons; full year-grid drill is a polish item
- **Keyboard arrow navigation across days** — Should item if time permits; Tab into popover + Enter to select is sufficient baseline
- **Updating call sites in `ServicePeriodForm`** — Phase 3 swaps `<Input type="date">` to `<CalendarPickerTH>` for multiplier dates
- **Removing `components/DatePickerTH.tsx`** — keep as re-export shim until Phase 4 cleanup

---

## Step-by-Step Tasks

### Task 1: Create scaffold + types in `components/ui/CalendarPickerTH.tsx`

- **ACTION**: Create new file with imports, prop interface, helper functions, and component shell
- **IMPLEMENT**:
  ```typescript
  "use client";

  import { useState, useRef, useEffect, useMemo } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
  import { parseThaiDate, toBE, toCE, formatThaiDate, daysInMonth } from "@/lib/utils";
  import { cn } from "@/lib/utils";

  export interface CalendarPickerTHProps {
    label?: string;
    value: string | null;
    onChange: (isoDate: string | null) => void;
    error?: string;
    helper?: string;
    required?: boolean;
    /** Optional: visually-hidden label for popover trigger when no `label` is given */
    ariaLabel?: string;
  }

  const THAI_MONTHS_SHORT = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
  ] as const;

  const THAI_MONTHS_LONG = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ] as const;

  const THAI_WEEKDAYS_SHORT = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."] as const;

  /**
   * Returns Date for the 1st of `month` in `ceYear`. Pure helper.
   */
  function firstOfMonth(ceYear: number, monthZeroBased: number): Date {
    return new Date(ceYear, monthZeroBased, 1);
  }

  /**
   * Day-of-week index Mon=0 .. Sun=6 (Thai convention).
   * JS native is Sun=0 .. Sat=6, so shift by -1 mod 7.
   */
  function thaiDow(date: Date): number {
    return (date.getDay() + 6) % 7;
  }

  export default function CalendarPickerTH(props: CalendarPickerTHProps) {
    // ...implementation in subsequent tasks
    return <div />;
  }
  ```
- **MIRROR**: `COMPONENT_FILE_HEADER`, `NAMING_CONVENTION` (UPPER_SNAKE for module constants)
- **IMPORTS**: from `react`, `framer-motion`, `lucide-react`, `@/lib/utils` (extend existing utils with `cn`)
- **GOTCHA**:
  - JS `Date.getDay()` is **Sun=0** but Thai calendars start on **Monday** — use `thaiDow` helper to remap
  - `daysInMonth(year, month)` from `lib/utils.ts` uses 1-based month — `new Date(year, month, 0).getDate()`. Confirmed match: pass 1-based month to get correct day count
  - Don't import `lib/utils.ts` twice — combine: `import { ..., cn } from "@/lib/utils"`
- **VALIDATE**:
  - File compiles with `npx tsc --noEmit`
  - Helper unit-check: `thaiDow(new Date('2025-01-06'))` → `0` (Monday); `thaiDow(new Date('2025-01-12'))` → `6` (Sunday)

---

### Task 2: Implement view state + month/year navigation

- **ACTION**: Add internal state for popover open + currently-viewing month, plus ‹ › navigation handlers
- **IMPLEMENT** (replace the placeholder return in Task 1):
  ```typescript
  export default function CalendarPickerTH({
    label, value, onChange, error, helper, required, ariaLabel,
  }: CalendarPickerTHProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [localError, setLocalError] = useState<string>("");

    // Currently-viewing month — separate from `value` so user can navigate without committing
    const [viewMonth, setViewMonth] = useState<Date>(() => {
      if (value) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return firstOfMonth(d.getFullYear(), d.getMonth());
      }
      return firstOfMonth(new Date().getFullYear(), new Date().getMonth());
    });

    const containerRef = useRef<HTMLDivElement>(null);

    // Sync viewMonth when value changes externally (e.g. retirement option auto-fill)
    useEffect(() => {
      if (value) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          setViewMonth(firstOfMonth(d.getFullYear(), d.getMonth()));
        }
      }
    }, [value]);

    // Click-outside to close
    useEffect(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    const goPrevMonth = () => {
      const next = new Date(viewMonth);
      next.setMonth(next.getMonth() - 1);
      setViewMonth(next);
    };
    const goNextMonth = () => {
      const next = new Date(viewMonth);
      next.setMonth(next.getMonth() + 1);
      setViewMonth(next);
    };
    const goPrevYear = () => {
      const next = new Date(viewMonth);
      next.setFullYear(next.getFullYear() - 1);
      setViewMonth(next);
    };
    const goNextYear = () => {
      const next = new Date(viewMonth);
      next.setFullYear(next.getFullYear() + 1);
      setViewMonth(next);
    };

    const triggerLabel = value ? formatThaiDate(value) : "เลือกวันที่";

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
            {label}
            {required && <span className="text-[var(--danger)] ml-1">*</span>}
          </label>
        )}

        {/* Trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={ariaLabel || label || "เลือกวันที่"}
          className={cn(
            "w-full px-4 py-3 rounded-xl border-2 bg-white text-left flex items-center justify-between min-h-[44px]",
            "focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)] transition-colors",
            (error || localError) ? "border-[var(--danger)]" : "border-gray-200",
          )}
        >
          <span className={value ? "text-[var(--text)]" : "text-gray-400"}>
            {triggerLabel}
          </span>
          <Calendar size={18} className="text-gray-400" />
        </button>

        {/* Popover (Tasks 3-4 fill in body) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-label="ปฏิทินเลือกวันที่"
              className="absolute z-50 mt-2 bg-white rounded-2xl border border-gray-200 shadow-[var(--shadow-e3)] p-4 w-[320px] max-w-[calc(100vw-32px)]"
            >
              {/* Header: month/year navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={goPrevYear}
                  aria-label="ปีก่อนหน้า"
                  className="p-2 rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px]"
                >
                  ‹‹
                </button>
                <button
                  type="button"
                  onClick={goPrevMonth}
                  aria-label="เดือนก่อนหน้า"
                  className="p-2 rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px]"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex-1 text-center font-semibold">
                  {THAI_MONTHS_LONG[viewMonth.getMonth()]} {toBE(viewMonth.getFullYear())}
                </div>
                <button
                  type="button"
                  onClick={goNextMonth}
                  aria-label="เดือนถัดไป"
                  className="p-2 rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px]"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={goNextYear}
                  aria-label="ปีถัดไป"
                  className="p-2 rounded-lg hover:bg-gray-100 min-w-[36px] min-h-[36px]"
                >
                  ››
                </button>
              </div>
              {/* Day grid (Task 3) */}
              {/* Keyboard fallback (Task 4) */}
            </motion.div>
          )}
        </AnimatePresence>

        {(error || localError) && (
          <p className="mt-1 text-sm text-[var(--danger)]">{error || localError}</p>
        )}
        {helper && !(error || localError) && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{helper}</p>
        )}
      </div>
    );
  }
  ```
- **MIRROR**: `POPOVER_WITH_FRAMER`, `TAILWIND_CLASS_COMPOSITION`, existing label/error/helper structure from `DatePickerTH.tsx:107-162`
- **IMPORTS**: already covered in Task 1
- **GOTCHA**:
  - **Click-outside**: `mousedown` (not `click`) so we close before any click event fires inside a focused input. Common React popover footgun
  - **Trigger button must be `type="button"`** — without it, defaults to `type="submit"` and submits any parent form
  - **`min-h-[44px]`** is the WCAG/older-user tap-target floor. Don't shrink for "design"
  - **Popover positioning**: `absolute` requires parent to be `relative`. The `containerRef` div is `position: static` by default — must add `relative` class. **Add `className="w-full relative"` to the outermost div**
  - **z-index**: 50 should be above page content; verify against `app/page.tsx`'s sticky header (`z-10`) — no conflict
- **VALIDATE**:
  - Open popover, navigate ‹ › ‹‹ ›› — viewMonth updates
  - Click outside — popover closes
  - `aria-expanded` toggles on trigger

---

### Task 3: Implement day grid with selection

- **ACTION**: Inside the popover, after the navigation header, render the day grid; wire click-to-select
- **IMPLEMENT** (insert in popover body, replacing `{/* Day grid (Task 3) */}` comment):
  ```typescript
  {/* Weekday header */}
  <div className="grid grid-cols-7 gap-1 mb-1">
    {THAI_WEEKDAYS_SHORT.map((d) => (
      <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
    ))}
  </div>

  {/* Day grid */}
  <div className="grid grid-cols-7 gap-1">
    {(() => {
      const year = viewMonth.getFullYear();
      const month = viewMonth.getMonth(); // 0-based
      const firstDow = thaiDow(firstOfMonth(year, month));
      const dayCount = daysInMonth(year, month + 1); // daysInMonth uses 1-based
      const cells: React.ReactNode[] = [];

      // Leading blanks
      for (let i = 0; i < firstDow; i++) {
        cells.push(<div key={`pad-${i}`} className="h-9" />);
      }

      // Day buttons
      const selectedISO = value;
      const selectedDate = selectedISO ? new Date(selectedISO) : null;
      const isSelectedDay = (d: number) =>
        selectedDate &&
        selectedDate.getFullYear() === year &&
        selectedDate.getMonth() === month &&
        selectedDate.getDate() === d;

      const today = new Date();
      const isToday = (d: number) =>
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === d;

      for (let d = 1; d <= dayCount; d++) {
        const sel = isSelectedDay(d);
        const tod = isToday(d);
        cells.push(
          <button
            key={d}
            type="button"
            onClick={() => {
              const picked = new Date(year, month, d);
              onChange(picked.toISOString());
              setLocalError("");
              setIsOpen(false);
            }}
            aria-label={`${d} ${THAI_MONTHS_LONG[month]} ${toBE(year)}`}
            aria-current={tod ? "date" : undefined}
            className={cn(
              "h-9 rounded-lg text-sm transition-colors min-w-[36px]",
              sel
                ? "bg-[var(--primary)] text-white font-semibold"
                : tod
                ? "bg-[var(--primary-light)]/15 text-[var(--primary)] font-medium hover:bg-[var(--primary-light)]/25"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            {d}
          </button>
        );
      }
      return cells;
    })()}
  </div>
  ```
- **MIRROR**: `TAILWIND_CLASS_COMPOSITION` (rounded-lg + transition-colors + hover variants)
- **IMPORTS**: already imported `daysInMonth` in Task 1
- **GOTCHA**:
  - **`daysInMonth(year, month)` is 1-based** — pass `month + 1` because `viewMonth.getMonth()` is 0-based
  - **`new Date(year, month, d)` is 0-based for month** — confusing inconsistency, but that's JS
  - **`new Date(...).toISOString()` returns UTC** — for a Thai user, `new Date(2500, 4, 15)` (May 15, 2500 BE = May 15, 1957 CE in local time) becomes `1957-05-14T17:00:00.000Z` if local TZ is +07. **Acceptable** — `formatThaiDate` reads via `new Date(iso).getDate()` which converts back to local. Keep as-is unless E2E flakes
  - **Selected highlight**: must compare local date components, not ISO strings (timezone may shift the day)
  - **Cell tap target**: `h-9` (36px) is below 44px ideal but acceptable in dense grids. The wider `min-w-[36px]` keeps it tappable. Alternative: `h-11` (44px) — try first, shrink if grid too tall
- **VALIDATE**:
  - Render May 2500 (BE) — first day of month aligns under correct weekday
  - Click day 15 — `onChange` fires with ISO string for that date; popover closes
  - Selected day shows with primary background; today highlights subtly
  - Year leap test: open February of leap year (e.g., 2003 CE = 2546 BE), should show 29 days

---

### Task 4: Implement keyboard input fallback below grid

- **ACTION**: Below the day grid, add a 3-input fallback (vว/ดด/ปปปป) wired to the same `onChange` so users who prefer typing can use this view too
- **IMPLEMENT** (insert after the day grid div, replacing `{/* Keyboard fallback (Task 4) */}` comment):
  ```typescript
  {/* Keyboard fallback */}
  <div className="mt-3 pt-3 border-t border-gray-100">
    <p className="text-xs text-gray-500 mb-2">หรือพิมพ์เอง:</p>
    <KeyboardInputRow
      value={value}
      onChange={(iso) => {
        onChange(iso);
        if (iso) {
          const d = new Date(iso);
          if (!isNaN(d.getTime())) {
            setViewMonth(firstOfMonth(d.getFullYear(), d.getMonth()));
          }
        }
        setLocalError("");
      }}
      onValidationError={setLocalError}
    />
  </div>
  ```

  Then add the `KeyboardInputRow` sub-component **at the bottom of the same file**:
  ```typescript
  interface KeyboardInputRowProps {
    value: string | null;
    onChange: (isoDate: string | null) => void;
    onValidationError: (msg: string) => void;
  }

  function KeyboardInputRow({ value, onChange, onValidationError }: KeyboardInputRowProps) {
    const dayRef = useRef<HTMLInputElement>(null);
    const monthRef = useRef<HTMLInputElement>(null);
    const yearRef = useRef<HTMLInputElement>(null);

    // Sync from external value
    useEffect(() => {
      if (!value) {
        if (dayRef.current) dayRef.current.value = "";
        if (monthRef.current) monthRef.current.value = "";
        if (yearRef.current) yearRef.current.value = "";
        return;
      }
      const d = new Date(value);
      if (isNaN(d.getTime())) return;
      if (dayRef.current) dayRef.current.value = d.getDate().toString().padStart(2, "0");
      if (monthRef.current) monthRef.current.value = (d.getMonth() + 1).toString().padStart(2, "0");
      if (yearRef.current) yearRef.current.value = toBE(d.getFullYear()).toString();
    }, [value]);

    const validateAndUpdate = () => {
      const day = dayRef.current?.value ?? "";
      const month = monthRef.current?.value ?? "";
      const beYear = yearRef.current?.value ?? "";
      onValidationError("");

      if (!day && !month && !beYear) {
        onChange(null);
        return;
      }
      if (!day || !month || !beYear) return; // partial — wait for completion

      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const beYearNum = parseInt(beYear, 10);

      if (dayNum < 1 || dayNum > 31) return onValidationError("วันที่ไม่ถูกต้อง");
      if (monthNum < 1 || monthNum > 12) return onValidationError("เดือนไม่ถูกต้อง");
      if (beYearNum < 2400 || beYearNum > 2600) return onValidationError("ปี พ.ศ. ไม่ถูกต้อง");

      try {
        const date = parseThaiDate(dayNum, monthNum, beYearNum);
        if (isNaN(date.getTime())) return onValidationError("วันที่ไม่ถูกต้อง");
        // Validate that the date didn't roll over (e.g. Feb 30 → Mar 2)
        if (date.getDate() !== dayNum || date.getMonth() + 1 !== monthNum) {
          return onValidationError("วันที่ไม่มีในเดือนนี้");
        }
        onChange(date.toISOString());
      } catch {
        onValidationError("วันที่ไม่ถูกต้อง");
      }
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>, maxLen: number) => {
      const el = e.currentTarget;
      el.value = el.value.replace(/\D/g, "").slice(0, maxLen);
      validateAndUpdate();
    };

    return (
      <div className="flex items-center gap-2">
        <input
          ref={dayRef}
          type="text"
          inputMode="numeric"
          placeholder="วว"
          maxLength={2}
          onInput={(e) => handleInput(e, 2)}
          className="flex-1 min-w-0 px-2 py-2 rounded-lg border border-gray-200 text-center text-sm focus:outline-none focus:border-[var(--primary)]"
        />
        <span className="text-gray-400">/</span>
        <input
          ref={monthRef}
          type="text"
          inputMode="numeric"
          placeholder="ดด"
          maxLength={2}
          onInput={(e) => handleInput(e, 2)}
          className="flex-1 min-w-0 px-2 py-2 rounded-lg border border-gray-200 text-center text-sm focus:outline-none focus:border-[var(--primary)]"
        />
        <span className="text-gray-400">/</span>
        <input
          ref={yearRef}
          type="text"
          inputMode="numeric"
          placeholder="ปปปป (พ.ศ.)"
          maxLength={4}
          onInput={(e) => handleInput(e, 4)}
          className="flex-[2] min-w-0 px-2 py-2 rounded-lg border border-gray-200 text-center text-sm focus:outline-none focus:border-[var(--primary)]"
        />
      </div>
    );
  }
  ```
- **MIRROR**: `KEYBOARD_INPUT_VALIDATION` (lift directly from existing `DatePickerTH.tsx:97-103`); existing 3-input validation flow
- **IMPORTS**: covered (no new)
- **GOTCHA**:
  - **NEW behavior over legacy**: detect roll-over (e.g. typing 30 ก.พ. → JS auto-rolls to 2 มี.ค.). The legacy code didn't catch this; the new check `date.getDate() !== dayNum` does
  - **Refs sync via `useEffect`** — required because the calendar grid click also updates `value`, which must propagate back into the keyboard fields
  - **Don't use `value`/`defaultValue` props** on inputs — uncontrolled with refs is the existing pattern; preserve it (lower re-render cost, simpler state)
  - **`maxLength` HTML attr** is the truth-source; the slice in `handleInput` is defense-in-depth
- **VALIDATE**:
  - Type "15/05/2500" digit-by-digit — `onChange` fires with valid ISO; calendar grid above re-positions to May 2500
  - Type "30/02/2520" — `onValidationError` fires with "วันที่ไม่มีในเดือนนี้"
  - Clear all 3 fields — `onChange(null)` fires
  - Pick day from grid — keyboard inputs update via useEffect

---

### Task 5: Update `components/DatePickerTH.tsx` to re-export

- **ACTION**: Replace the body of `components/DatePickerTH.tsx` with a re-export shim so existing call sites in `PersonalInfoForm.tsx` continue to work without code changes
- **IMPLEMENT** (replace entire file):
  ```typescript
  /**
   * @deprecated since Phase 2A — re-export shim. Direct imports should use
   * `import CalendarPickerTH from "@/components/ui/CalendarPickerTH"` going forward.
   * Phase 4 cleanup will delete this file after all consumers migrate.
   */
  export { default } from "./ui/CalendarPickerTH";
  export type { CalendarPickerTHProps as DatePickerTHProps } from "./ui/CalendarPickerTH";
  ```
- **MIRROR**: `BACKWARD_COMPAT_DEPRECATION` (the `@deprecated` JSDoc tag pattern from Phase 1)
- **IMPORTS**: none — pure re-export
- **GOTCHA**:
  - **`PersonalInfoForm.tsx:4`** does `import DatePickerTH from "@/components/DatePickerTH"` — this still resolves to the default export, now coming from the new file. No change needed there
  - The original prop name `DatePickerTHProps` is preserved as a type alias so any consumer typing on the legacy name still compiles
- **VALIDATE**:
  - `npx tsc --noEmit` — passes
  - `PersonalInfoForm` renders without code change; date picker shows new calendar UX
  - `app/sections/PersonalInfoForm.tsx` not modified in Phase 2A — Phase 3 will retarget the import to the new path during its rebuild

---

## Testing Strategy

### Manual UX Test Matrix

| Scenario | Steps | Expected |
|---|---|---|
| Initial empty | Open `PersonalInfoForm` | Trigger shows "เลือกวันที่" placeholder |
| Tap to open | Click trigger | Popover animates in (or instant if reduced-motion) |
| Pick today | Click ‹ › until current month, click today | Trigger shows formatted date; popover closes |
| Pick out-of-month day | Pick May then change to June via › | Selected highlight on June equivalent |
| Type valid date | Type 15/05/2500 in keyboard row | Calendar repositions to May 2500; trigger shows "15/05/2500" |
| Type invalid date | Type 30/02/2520 | Error: "วันที่ไม่มีในเดือนนี้" |
| Clear via type | Delete all fields | Trigger shows placeholder; `onChange(null)` |
| Reduced motion | System Reduce Motion ON, open popover | Popover snaps in (under 10ms) |
| Click outside | Open then click body | Popover closes |
| Esc to close | (Should item — tab + Esc handler) | If implemented: closes; otherwise: skip |
| Keyboard a11y | Tab to trigger, Enter, Tab through nav | Focus traverses; Enter triggers action |

### Edge Cases Checklist
- [ ] Year input "2400" → valid (lower bound)
- [ ] Year input "2399" → "ปี พ.ศ. ไม่ถูกต้อง"
- [ ] Year input "2600" → valid; "2601" → invalid
- [ ] Day 31 in 30-day month
- [ ] Feb 29 in leap year (CE 2000, 2004, ..., 2024) — should be valid
- [ ] Feb 29 in non-leap year — should error
- [ ] External `value` change (parent updates via retirement option) — calendar re-renders to that month, keyboard fields sync
- [ ] Multiple instances on one page (`PersonalInfoForm` has 3) — independent state, click-outside per instance
- [ ] Popover overflow on small screens — `max-w-[calc(100vw-32px)]` clamps; verify on 320px-wide viewport

---

## Validation Commands

```bash
# Static
npx tsc --noEmit

# Lint
npm run lint

# Build (check Tailwind picks up new CSS variables in component classes)
npm run build

# Run existing E2E (must still pass with new picker UI)
npx playwright test
```

⚠️ **E2E note**: `e2e/smoke.spec.ts` uses `page.locator('[placeholder="วว"]')` — Phase 2A's keyboard fallback preserves this exact placeholder, so existing tests continue to find the inputs. **No E2E updates needed in Phase 2A.** Phase 6 will add new tests for calendar-grid interactions.

```bash
# Manual dev session
npm run dev
```
- [ ] Visit `/` → Step 1
- [ ] Tap วันเกิด trigger → calendar shows
- [ ] Pick day → trigger updates, popover closes
- [ ] Tab through 3 date pickers — each opens its own popover

---

## Acceptance Criteria

- [ ] `components/ui/CalendarPickerTH.tsx` created with full implementation (Tasks 1–4)
- [ ] `components/DatePickerTH.tsx` reduced to re-export shim (Task 5)
- [ ] Calendar grid renders correctly Mon-start, Thai weekday/month names
- [ ] Day click → `onChange(iso)` + popover closes
- [ ] Keyboard inputs validate + sync to grid
- [ ] Roll-over detection catches "30 ก.พ."
- [ ] `prefers-reduced-motion` disables popover animation
- [ ] Click-outside + ARIA roles work
- [ ] All 3 instances in `PersonalInfoForm` render and select independently
- [ ] `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npx playwright test` all green

## Completion Checklist

- [ ] Code follows Phase 1 patterns (Tailwind v4 tokens, `cn()`, `ease-out-expo`)
- [ ] No deps added (Framer Motion + Lucide already present)
- [ ] All animation goes through `prefers-reduced-motion` override (auto-applied by Phase 1's wildcard rule)
- [ ] Trigger button + day buttons all `type="button"`
- [ ] Tap targets ≥36px in grid, ≥44px on trigger
- [ ] Self-contained: no codebase searches needed mid-implementation

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Popover positioning broken on small mobile (overflows viewport) | M | Cropped UI | `max-w-[calc(100vw-32px)]` + `mt-2` from trigger; manual test on 320px |
| Keyboard fallback `useEffect` sync loop with grid click | M | Infinite re-render | Keyboard inputs are uncontrolled (refs only); grid click triggers `onChange` → parent value changes → useEffect updates ref. **One-way data flow**, no loop |
| Timezone bug — picked day off by one in some locales | L | Selected ≠ what user clicked | Use local-date components for selection comparison; document caveat |
| Click-outside fires during legitimate inside click (e.g., touchscreen taps) | L | Popover closes prematurely | `mousedown` (not `click`); use `containerRef.current.contains(target)` check |
| 3 picker instances share state accidentally | L | Wrong picker opens | Each instance owns its own `useState` — independent. Confirmed by component-instance-per-call-site convention |
| Calendar performance on slow phones (re-creating cells every render) | L | Stutter on open | Day grid is computed inside IIFE — minor cost; if measured slow, memoize with `useMemo([year, month])` |
| Multiple Framer Motion popovers exit-transitioning simultaneously | L | Visual flicker | Each instance has own AnimatePresence; isolated |

## Notes

- **Why not React Aria / react-day-picker / Mantine DatePicker?** Time budget. Adding a new UI library is its own multi-hour investigation (bundle size, theming, Thai locale support). The home-built component is bounded, single-purpose, and uses only existing deps
- **Why keyboard fallback below grid (not as separate mode)?** Power users can type quickly without losing the visual confirmation. Older users can ignore it and tap. Both audiences served on one screen
- **Why `daysInMonth` is reused not reimplemented?** It's already in `lib/utils.ts:62-64` — a pure helper. Reuse honors the "one source of truth" principle
- **Why month-name array is module-const not export?** Locale-specific to this component; not a candidate for reuse elsewhere. Keeping it local minimizes coupling
