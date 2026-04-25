# Plan: Phase 2B — UI Primitives Update

## Summary

Refresh the existing UI primitives (`Button`, `Card`, `Input`, `Tooltip`, `ProgressBar`) to the calm-fintech baseline using Phase 1's design tokens, **add a new `SegmentedControl`** for Mode Select / retirement option, and **rebuild `ProgressBar` to 6 steps with renamed labels**. Runs **in parallel with Phase 2A** — both depend only on Phase 1.

## User Story

As a 50+ user on mobile,
I want buttons / cards / inputs / progress indicators that feel calm, modern, and trustworthy with tap-targets I can hit,
so that I can navigate the wizard confidently without misclicking or feeling overwhelmed by motion.

## Problem → Solution

**Current state**:
- `Button` — flat colors, no gradient, ~36px tap target on small variants
- `Card` — soft shadow but no gradient header option, no surface elevation system
- `Input` — works but uses `--shadow-md` directly; no calm-fintech polish
- `Tooltip` — exists but uses hover-only pattern (a11y risk for keyboard/touch)
- `ProgressBar` — hardcoded 5 steps with old labels (`["ข้อมูลส่วนตัว", "เวลาราชการ", "ตำแหน่ง/เงินเดือน", "ประวัติเลื่อนเงินเดือน", "ผลลัพธ์"]`)
- **No `SegmentedControl`** — Step 0 (Mode Select) and `retirementOption` toggle in `PersonalInfoForm.tsx:77-93` reimplement segmented-button styling inline

**Desired state**:
- All primitives consume Phase 1 tokens (`--gradient-mesh-primary`, `--ease-out-expo`, `--shadow-e2..e4`, `--duration-fast`)
- Tap targets ≥44px on every interactive primitive
- `Tooltip` keyboard + focus-visible accessible
- `ProgressBar` shows 6 steps: `["เลือกประเภท", "ข้อมูลส่วนตัว", "เวลาราชการ", "ประวัติเลื่อนเงินเดือน", "การคำนวณ", "ผลลัพธ์"]`
- `SegmentedControl` is a generic 2–4 option toggle reusable across Mode Select, retirement option, and any future binary toggle

## Metadata

- **Complexity**: Medium (5 files updated, 1 new, ~250 net lines)
- **Source PRD**: `.claude/PRPs/prds/early-retire-redesign.prd.md`
- **PRD Phase**: Phase 2B — UI Primitives Update
- **Estimated Files**: 6 (5 modified + 1 created)
- **Time-box**: 1.5 hours (per PRD)
- **Strategy**: **Visual refresh** — APIs preserved; existing call sites continue to work

---

## UX Design

### Before
- Buttons: flat `bg-[var(--primary)]`; small variant 36px tall
- Cards: white + `shadow-md`; no header gradient
- ProgressBar: 5 dots/circles, label "ตำแหน่ง/เงินเดือน" at step 3

### After
- Primary buttons: gradient `var(--gradient-mesh-primary)` with smooth hover lift; min 44px tall
- Cards: solid white surface + optional gradient header strip; elevation `var(--shadow-e2)` default, `--shadow-e3` on hover
- ProgressBar: 6 steps, labels match the new wizard order

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Primary button tap | Flat color, no lift | Subtle scale-down 0.98 on press, gradient bg | Tactile feel |
| Card hover (desktop) | No effect | Subtle elevation increase | Optional |
| Mode Select | (didn't exist) | Two large segmented cards; clear active state | New |
| ProgressBar step | 5 dots | 6 dots with new labels | Reflects new wizard |
| Tooltip activation | Hover-only | Hover OR focus-visible OR longpress | Keyboard a11y |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `components/ui/Button.tsx` | full | Existing API to preserve (`variant`, `size`, `icon`, `disabled`, `onClick`) |
| P0 | `components/ui/Card.tsx` | full | Existing API (`header`, `children`, `className`) |
| P0 | `components/ui/Input.tsx` | full | Existing API (`label`, `value`, `onChange`, `type`, `suffix`, `step`, `min`) |
| P0 | `components/ui/Tooltip.tsx` | full | Existing API |
| P0 | `components/ProgressBar.tsx` | 1–108 | 5-step hardcoded array to replace |
| P0 | `app/sections/PersonalInfoForm.tsx` | 77–93 | Inline segmented-button pattern to extract into `SegmentedControl` |
| P1 | `.claude/PRPs/plans/phase-1-foundation.plan.md` | "Patterns to Mirror" | Token usage rules |
| P1 | `lib/utils.ts` | 1–6 | `cn()` utility |
| P2 | `app/page.tsx` | 187–217 | Header / sticky-nav structure (so `ProgressBar` integration unchanged) |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Framer Motion gestures | https://www.framer.com/motion/gestures/ | Use `whileTap={{ scale: 0.98 }}` for tactile button feedback |
| WCAG tap targets | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | 24×24 CSS pixels minimum (AA); 44×44 best practice for older users |
| ARIA tabs vs radiogroup | https://www.w3.org/WAI/ARIA/apg/patterns/radio/ | Mode Select is conceptually a radiogroup, not tabs |

---

## Patterns to Mirror

### EXISTING_BUTTON_VARIANT_API
```typescript
// SOURCE: components/ui/Button.tsx (existing — read before changing)
// Preserves: variant, size, icon, disabled, onClick, type
// Adds: subtle gradient on primary; press scale; min-height ≥44px
```

### EXISTING_CARD_API
```typescript
// SOURCE: components/ui/Card.tsx
// Preserves: header (ReactNode), children, className
// Adds: elevation prop ("e1" | "e2" | "e3"; default "e2"); optional gradient header
```

### TOKEN_CONSUMPTION_TAILWIND_V4
```typescript
// Phase 1 Pattern: consume new tokens via utility-class form
className="bg-[var(--gradient-mesh-primary)] shadow-e2 duration-fast ease-out-expo"

// Or via arbitrary value
className="shadow-[var(--shadow-e2)] transition-shadow duration-[var(--duration-fast)]"
```
- Prefer utility form when token is in `@theme inline` (Phase 1 exposes them)
- Use arbitrary form for one-off references

### MOTION_BUTTON_PRESS
```typescript
// NEW PATTERN — establish here:
import { motion } from "framer-motion";

<motion.button
  whileTap={{ scale: 0.98 }}
  whileHover={{ y: -1 }}
  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
  className="..."
>
  ...
</motion.button>
```
- Reduced-motion compliance via Phase 1's wildcard CSS — no opt-out needed at component level

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `components/ui/Button.tsx` | UPDATE | Gradient primary, motion press, ≥44px tap target |
| `components/ui/Card.tsx` | UPDATE | Add `elevation` prop, optional gradient header |
| `components/ui/Input.tsx` | UPDATE | 44px height, focus ring using new tokens |
| `components/ui/Tooltip.tsx` | UPDATE | Add focus-visible trigger, keyboard a11y |
| `components/ui/SegmentedControl.tsx` | CREATE | Generic 2–4 option segmented button group |
| `components/ProgressBar.tsx` | UPDATE | 6 steps with new labels |

## NOT Building

- **Replacing every existing color reference with new gradient tokens** — only primary buttons + Mode Select cards use gradient; data cards stay solid (UI research)
- **Dark mode variants** — out of scope ("light first")
- **Renaming components** — APIs preserved
- **Removing Tooltip from anywhere** — Phase 5 will add tooltip usage; Phase 2B just makes the primitive better
- **Migrating all `<Input>` instances to a new naming** — same name, same path

---

## Step-by-Step Tasks

### Task 1: Refresh `components/ui/Button.tsx`

- **ACTION**: Replace component body with motion-wrapped button using gradient primary + new tokens
- **IMPLEMENT**:
  ```typescript
  "use client";

  import { motion, type HTMLMotionProps } from "framer-motion";
  import { cn } from "@/lib/utils";
  import type { ReactNode } from "react";

  type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
  type ButtonSize = "sm" | "md" | "lg";

  interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: ReactNode;
    children?: ReactNode;
    fullWidth?: boolean;
  }

  const variantClass: Record<ButtonVariant, string> = {
    primary:
      "bg-[image:var(--gradient-mesh-primary)] text-white shadow-[var(--shadow-e2)] hover:shadow-[var(--shadow-e3)]",
    secondary:
      "bg-[var(--color-secondary)] text-[var(--color-primary)] hover:bg-[var(--color-secondary-dark)]",
    outline:
      "bg-white text-[var(--color-primary)] border-2 border-[var(--color-primary)] hover:bg-[var(--color-secondary)]",
    ghost:
      "bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-secondary)]",
  };

  const sizeClass: Record<ButtonSize, string> = {
    sm: "px-3 py-2 text-sm min-h-[36px]",
    md: "px-4 py-2.5 text-base min-h-[44px]",
    lg: "px-6 py-3 text-base min-h-[52px]",
  };

  export default function Button({
    variant = "primary",
    size = "md",
    icon,
    children,
    fullWidth,
    className,
    disabled,
    ...rest
  }: ButtonProps) {
    return (
      <motion.button
        type="button"
        whileTap={disabled ? undefined : { scale: 0.98 }}
        whileHover={disabled ? undefined : { y: -1 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-shadow",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)] focus-visible:ring-offset-2",
          variantClass[variant],
          sizeClass[size],
          fullWidth && "w-full",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        {...rest}
      >
        {icon}
        {children}
      </motion.button>
    );
  }
  ```
- **MIRROR**: `EXISTING_BUTTON_VARIANT_API` (preserve all existing props), `MOTION_BUTTON_PRESS`, `TOKEN_CONSUMPTION_TAILWIND_V4`
- **IMPORTS**: `framer-motion`, `@/lib/utils`, `react` types
- **GOTCHA**:
  - **Tailwind v4 gradient as background**: Tailwind doesn't have a `bg-gradient-mesh-primary` utility for `linear-gradient` values declared in `@theme inline`. Use **arbitrary `bg-[image:var(...)]`** syntax: `bg-[image:var(--gradient-mesh-primary)]` — the `image:` prefix tells Tailwind it's a `background-image` not `background-color`
  - **Type for HTMLMotionProps**: Framer's `HTMLMotionProps<"button">` is the correct base; omit `children` because we re-declare with `ReactNode` for clarity
  - **`whileTap={undefined}` when disabled** — explicit undefined disables the hover/tap animations on disabled state
  - **`focus-visible` not `focus`** — keyboard-only ring; mouse clicks don't show ring
  - **Existing call sites**: `Button` is used everywhere (e.g. `PersonalInfoForm.tsx:118-123`, `ServicePeriodForm.tsx:152-158`). All use `variant`, `size`, `icon`, `disabled`, `onClick`, `children` — all preserved. Check that `onClick` lands via `...rest`
- **VALIDATE**:
  - `npx tsc --noEmit`
  - Visit existing wizard — all buttons render with new gradient on primary
  - Click button — feel scale-down on press (or instant if reduced-motion)
  - Tab to button — visible focus ring on `focus-visible`

---

### Task 2: Refresh `components/ui/Card.tsx`

- **ACTION**: Add `elevation` prop, optional `gradient` header style, motion hover-lift
- **IMPLEMENT**:
  ```typescript
  "use client";

  import { motion, type HTMLMotionProps } from "framer-motion";
  import { cn } from "@/lib/utils";
  import type { ReactNode } from "react";

  type Elevation = "e1" | "e2" | "e3" | "e4";

  interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children?: ReactNode;
    header?: ReactNode;
    /** Render the header with the primary gradient. Use sparingly — chrome only */
    gradientHeader?: boolean;
    elevation?: Elevation;
    interactive?: boolean;
  }

  const elevationClass: Record<Elevation, string> = {
    e1: "shadow-[var(--shadow-e1)]",
    e2: "shadow-[var(--shadow-e2)]",
    e3: "shadow-[var(--shadow-e3)]",
    e4: "shadow-[var(--shadow-e4)]",
  };

  export default function Card({
    children,
    header,
    gradientHeader,
    elevation = "e2",
    interactive,
    className,
    ...rest
  }: CardProps) {
    return (
      <motion.div
        whileHover={interactive ? { y: -2 } : undefined}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "bg-[var(--surface-data)] rounded-2xl overflow-hidden transition-shadow",
          elevationClass[elevation],
          interactive && "cursor-pointer hover:shadow-[var(--shadow-e3)]",
          className,
        )}
        {...rest}
      >
        {header && (
          <div
            className={cn(
              "px-5 py-4",
              gradientHeader
                ? "bg-[image:var(--gradient-mesh-primary)] text-white"
                : "border-b border-gray-100",
            )}
          >
            {header}
          </div>
        )}
        <div className={header ? "p-5" : "p-5"}>{children}</div>
      </motion.div>
    );
  }
  ```
- **MIRROR**: `EXISTING_CARD_API` (header, children, className preserved), `TOKEN_CONSUMPTION_TAILWIND_V4`
- **IMPORTS**: same pattern as Button
- **GOTCHA**:
  - **`overflow-hidden` on root** — required so `gradientHeader` doesn't bleed past `rounded-2xl` corners
  - **`bg-[var(--surface-data)]`** — Phase 1 token, equals `#ffffff`. Using token (not hardcoded `bg-white`) future-proofs theme changes
  - **Existing call sites** in `ResultSection.tsx:130, 145, 165, 196` use `<Card header={...} className="bg-gradient-to-br from-blue-50 to-white">`. After this change, the `bg-gradient-to-br...` class still applies (it overrides `--surface-data`) — **backward compatible**. Phase 3's `ResultSection` rewrite can simplify these to `<Card gradientHeader>` if desired, but Phase 2B leaves them
  - **`interactive` is opt-in** — only apply hover-lift on cards designed to be clickable (e.g. Mode Select cards in Phase 3)
- **VALIDATE**:
  - `npx tsc --noEmit`
  - `ResultSection` renders unchanged
  - New `<Card elevation="e3" interactive>` renders with stronger shadow + hover-lift

---

### Task 3: Refresh `components/ui/Input.tsx`

- **ACTION**: Increase height to 44px, refresh focus ring with new token, preserve API
- **IMPLEMENT** (replace component body, preserve existing prop interface):
  ```typescript
  "use client";

  import { cn } from "@/lib/utils";
  import type { InputHTMLAttributes, ReactNode } from "react";

  interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    label?: string;
    value: string | number;
    onChange: (value: string) => void;
    error?: string;
    helper?: string;
    suffix?: ReactNode;
    required?: boolean;
  }

  export default function Input({
    label,
    value,
    onChange,
    error,
    helper,
    suffix,
    required,
    className,
    ...rest
  }: InputProps) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
            {label}
            {required && <span className="text-[var(--danger)] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "w-full px-4 py-3 min-h-[44px] rounded-xl border-2 bg-white text-[var(--text)]",
              "focus:outline-none focus:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]",
              "transition-colors duration-[var(--duration-fast)]",
              error ? "border-[var(--danger)]" : "border-gray-200",
              suffix && "pr-12",
              className,
            )}
            {...rest}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>}
        {helper && !error && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{helper}</p>
        )}
      </div>
    );
  }
  ```
- **MIRROR**: existing label/error/helper structure, `TOKEN_CONSUMPTION_TAILWIND_V4`
- **IMPORTS**: `react` types, `cn`
- **GOTCHA**:
  - **`onChange` signature stays `(value: string) => void`** — diverges from native React `(e: ChangeEvent) => void` because every existing call site assumes string-only. **Don't change** or every call site breaks
  - **`value: string | number`** — codebase passes `parseFloat(form.currentSalary) || 0` (number) AND raw strings. Accept both
  - **`min-h-[44px]`** — primary tap-target requirement. Don't reduce
  - **`type="date"` callsites** in `ServicePeriodForm.tsx:99-104` will be replaced by `CalendarPickerTH` in Phase 3; keep `type="date"` working in this primitive for backward compat until then
- **VALIDATE**:
  - `npx tsc --noEmit`
  - All inputs in existing forms render at 44px height
  - Focus shows ring without click

---

### Task 4: Refresh `components/ui/Tooltip.tsx` for keyboard a11y

- **ACTION**: Add focus-visible trigger; preserve hover behavior
- **IMPLEMENT**:
  ```typescript
  "use client";

  import { useState, type ReactNode } from "react";
  import { motion, AnimatePresence } from "framer-motion";
  import { cn } from "@/lib/utils";

  interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    side?: "top" | "bottom" | "left" | "right";
  }

  const sideClass: Record<NonNullable<TooltipProps["side"]>, string> = {
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
  };

  export default function Tooltip({ content, children, side = "top" }: TooltipProps) {
    const [open, setOpen] = useState(false);

    return (
      <span
        className="relative inline-flex"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
        <AnimatePresence>
          {open && (
            <motion.span
              role="tooltip"
              initial={{ opacity: 0, y: side === "top" ? 4 : -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute z-40 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs whitespace-nowrap pointer-events-none",
                sideClass[side],
              )}
            >
              {content}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    );
  }
  ```
- **MIRROR**: existing `Tooltip.tsx` API
- **IMPORTS**: standard
- **GOTCHA**:
  - **`onFocus` / `onBlur` on parent `<span>`** — bubbles from focusable child (button/input). Without this, keyboard users never see the tooltip
  - **`role="tooltip"`** — correct ARIA role; pair with `aria-describedby` on the trigger child if implementing fully (Should item — basic role is acceptable baseline)
  - **`pointer-events-none`** — hover state belongs to parent span, not tooltip itself; without this, tooltip can absorb a click and break touch
  - **No `prefers-reduced-motion` opt-out** — Phase 1's wildcard CSS already disables; trust the system
- **VALIDATE**:
  - Hover trigger → tooltip appears
  - Tab to focusable trigger → tooltip appears
  - Touch trigger (mobile) — tooltip appears on focus (input) but not on `<div>` (focus-only). Acceptable: tooltips are auxiliary; primary info should be in `helper` text

---

### Task 5: Create `components/ui/SegmentedControl.tsx`

- **ACTION**: New generic segmented control for Mode Select + retirement option
- **IMPLEMENT**:
  ```typescript
  "use client";

  import { motion } from "framer-motion";
  import { cn } from "@/lib/utils";
  import type { ReactNode } from "react";

  interface SegmentedOption<T extends string> {
    value: T;
    label: string;
    icon?: ReactNode;
  }

  interface SegmentedControlProps<T extends string> {
    options: SegmentedOption<T>[];
    value: T | null;
    onChange: (value: T) => void;
    "aria-label"?: string;
    fullWidth?: boolean;
  }

  export default function SegmentedControl<T extends string>({
    options,
    value,
    onChange,
    "aria-label": ariaLabel,
    fullWidth,
  }: SegmentedControlProps<T>) {
    return (
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        className={cn(
          "inline-flex bg-gray-100 rounded-xl p-1 gap-1",
          fullWidth && "w-full",
        )}
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                "min-h-[44px] transition-colors duration-[var(--duration-fast)]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-light)]",
                selected
                  ? "bg-white text-[var(--color-primary)] shadow-[var(--shadow-e1)]"
                  : "text-gray-600 hover:text-gray-800",
              )}
            >
              {opt.icon}
              {opt.label}
            </motion.button>
          );
        })}
      </div>
    );
  }
  ```
- **MIRROR**: existing tab-toggle pattern from `ResultSection.tsx:62-84` (the inline mode toggle that this primitive replaces); `MOTION_BUTTON_PRESS`
- **IMPORTS**: standard
- **GOTCHA**:
  - **Generic over `T extends string`** — type-safe with literal unions: `<SegmentedControl<"gfp" | "non-gfp">>` ensures `value` and option values match
  - **`role="radiogroup"` + `role="radio"`** — semantically correct (mutually exclusive selection); ARIA tabs is **wrong** because tabs imply lazy-loaded panels
  - **`aria-checked` not `aria-selected`** — radio uses checked
  - **`value: T | null`** — Mode Select starts unselected (null); other usages may always have a value
  - **`fullWidth` opt-in** — Mode Select wants full-width on mobile; retirement-option toggle doesn't
- **VALIDATE**:
  - Renders 2 / 3 / 4 options correctly
  - Click changes selection; visual updates instantly
  - Keyboard: Tab in, Space toggles, Arrow keys (basic; full ARIA radio nav is Should item)

---

### Task 6: Update `components/ProgressBar.tsx` to 6 steps + new labels

- **ACTION**: Replace the `steps` array; preserve all rendering logic
- **IMPLEMENT** (single-line array change at top of file):
  ```typescript
  // BEFORE (lines 5-11):
  const steps = [
    "ข้อมูลส่วนตัว",
    "เวลาราชการ",
    "ตำแหน่ง/เงินเดือน",
    "ประวัติเลื่อนเงินเดือน",
    "ผลลัพธ์",
  ];

  // AFTER:
  const steps = [
    "เลือกประเภท",
    "ข้อมูลส่วนตัว",
    "เวลาราชการ",
    "ประวัติเลื่อนเงินเดือน",
    "การคำนวณ",
    "ผลลัพธ์",
  ];
  ```

  Optionally: refresh the active-color tokens to use Phase 1 tokens (cosmetic):
  ```typescript
  // Replace the inline color codes (~lines 33-35):
  // BEFORE: backgroundColor: isCompleted ? "#38a169" : isActive ? "#1e3a5f" : "#e2e8f0"
  // AFTER:  use tokens via CSS variables
  // (or leave as-is — colors are already correct)
  ```
- **MIRROR**: existing animation + responsive behavior (desktop full labels, mobile dots)
- **IMPORTS**: no new
- **GOTCHA**:
  - **Length change from 5 to 6** ripples to `app/page.tsx:148-183` `steps` array (handled in Phase 4) — not Phase 2B's problem
  - **Text overflow on desktop**: 6 labels in a row may crowd at narrow desktop. Existing `whitespace-nowrap` keeps text intact; if it overflows, `flex-1` divides space — acceptable for the calm-fintech "wider container" container layout. Test at 768px breakpoint
  - **`currentStep` prop type unchanged** — caller `app/page.tsx:198` passes `step` as number; Phase 4 will increment to support 0–5
- **VALIDATE**:
  - Render with `currentStep={0}` → "เลือกประเภท" highlighted
  - Render with `currentStep={5}` → "ผลลัพธ์" highlighted, all previous green
  - Mobile view shows 6 dots

---

## Testing Strategy

### Visual Regression Spot Check
- Open existing wizard → all primitives render
- Buttons: gradient on primary, scale on press
- Cards: solid + soft shadow; hover lift if `interactive`
- Inputs: 44px tall, visible focus ring on Tab
- Tooltip: shows on hover AND focus
- ProgressBar: 6 steps now rendered

### Edge Cases Checklist
- [ ] Disabled button — no hover/tap motion, opacity 50%
- [ ] Long button text — wraps gracefully (consider `whitespace-nowrap` only for short labels)
- [ ] Card with no header — bottom-only padding correct
- [ ] Card with `gradientHeader` — corners rounded, no overflow bleed
- [ ] Input with both `error` and `suffix` — error message below, suffix in input
- [ ] SegmentedControl with `null` value — no option highlighted
- [ ] SegmentedControl 4 options — tap targets still ≥36px each
- [ ] ProgressBar at `currentStep=0` and `currentStep=5` — bookend states correct

---

## Validation Commands

```bash
npx tsc --noEmit
npm run lint
npm run build
npx playwright test
npm run dev   # visual check
```

⚠️ **E2E note**: Existing tests use `page.locator('button:has-text("ถัดไป")')` and `page.locator('text=ดูผลลัพธ์')` — these still work because Button text content is preserved. **No E2E updates needed in Phase 2B.**

---

## Acceptance Criteria

- [ ] Button: gradient primary, motion press, ≥44px (size md+)
- [ ] Card: elevation prop works (e1–e4); gradient header opt-in
- [ ] Input: 44px height, focus-visible ring
- [ ] Tooltip: opens on hover AND focus
- [ ] SegmentedControl: created, type-safe, accessible
- [ ] ProgressBar: 6 steps, new labels
- [ ] All existing call sites render without code changes (backward compatible)
- [ ] `npx tsc --noEmit` + `npm run lint` + `npm run build` + `npx playwright test` all green

## Completion Checklist

- [ ] Phase 1 tokens consumed (gradient-mesh-primary, ease-out-expo, shadow-e2/e3, duration-fast)
- [ ] No new dependencies
- [ ] Tap targets ≥44px on every interactive primitive (buttons, inputs, segmented options)
- [ ] focus-visible (not focus) for keyboard rings
- [ ] All animations through Framer + reduced-motion CSS auto-applied
- [ ] APIs preserved — no Phase 3 import path changes needed solely for primitive updates

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tailwind v4 doesn't generate utility for `bg-[image:var(--gradient-mesh-primary)]` | L | Gradient doesn't render | Use arbitrary syntax `bg-[image:var(...)]` — works for any CSS variable. If still broken, fall back to inline `style={{ backgroundImage: "var(--gradient-mesh-primary)" }}` |
| `ProgressBar` 6 labels overflow on narrow desktop | L | Text crowding | `flex-1` + `whitespace-nowrap` + `text-xs`; if still tight, drop to `text-[11px]` at md breakpoint |
| `SegmentedControl` generic causes inference issues | L | Type errors at call sites | Test with explicit type param: `<SegmentedControl<"gfp" \| "non-gfp">>`. Most call sites infer correctly |
| `Button` `whileHover={{ y: -1 }}` causes layout shift in tight grids | L | Visual jump | -1px is below `font-size`, generally invisible; if ProgressBar dots jump, add `relative` + `transform: translateZ(0)` to parent |
| Tooltip pointer-events-none breaks click-through-tooltip-to-button (rare) | L | Misclick | `pointer-events-none` is correct — clicks pass through to the trigger |
| Existing `<Card>` call sites pass `className="bg-gradient-to-br..."` overriding the new `bg-[var(--surface-data)]` | M | Overridden styling visible | Backward compatible by intent — Phase 3 will revisit |

## Notes

- **Why update primitives in 2B parallel with 2A?** Independent files; merging Phase 1 → 2A and 2B simultaneously reduces critical-path time. Phase 3 needs both, so neither blocks the other
- **Why no Storybook / visual snapshot tests?** Out of scope for 1-day sprint. Visual check + existing E2E covers regression risk
- **Why not extract a `Stack` / `Cluster` primitive?** Tailwind utility classes (flex, gap-N) already provide layout — a wrapper component adds indirection without value
- **Tooltip improvements deferred**: full ARIA `aria-describedby` linkage, longpress trigger, dismiss-on-Esc — Should items if Phase 5 has time
