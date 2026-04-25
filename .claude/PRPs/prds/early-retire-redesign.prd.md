# Early Retire — Mobile-First Redesign

> Full redesign of the Thai civil-servant pension calculator into a "calm fintech" mobile-first experience, plus 8 specific structural/UX changes to the wizard. **Single-day implementation** with Claude pair-programming.

---

## Problem Statement

ข้าราชการสำนักงานปลัดกระทรวงยุติธรรม อายุ 50+ ที่กังวลจากเฟกนิวส์เรื่องโครงการเกษียณก่อนกำหนด ต้องการคำนวณบำเหน็จบำนาญของตัวเองได้บนมือถือทันที — แต่ปัจจุบันต้องไปขอเจ้าหน้าที่ HR เปิด Excel ที่สูตรซับซ้อนเกินกว่าจะใช้เอง และเว็บคำนวณรุ่นเก่ามี UI ที่ดูไม่น่าเชื่อถือ + ตารางคำนวณที่ผู้ใช้แก้รายการไม่ได้ ทำให้ผู้ใช้ที่ตื่นตระหนกหันไปใช้ข่าวลือเป็นแหล่งตัดสินใจแทนตัวเลขจริง

## Evidence

- **Owner observation**: "ของเดิมยังไม่สวย, ตารางมีรายการที่แก้ไม่ได้"
- **Owner observation**: "Excel ใช้แค่เจ้าหน้าที่, สูตรค่อนข้างยาก" — ข้าราชการทั่วไปเปิด Excel เองคำนวณไม่ออก
- **Trigger พิเศษ**: เฟกนิวส์เรื่องเกษียณก่อนกำหนด → demand spike จากผู้ใช้ first-time
- **Codebase analysis**: leave-deduction inputs (`sickLeaveDays`, `personalLeaveDays`, `vacationDays`) มี UI แต่ `calculateServicePeriod` ไม่หักจริง — existing bug ที่ผู้ใช้อาจสับสน
- *Assumption — needs validation*: ตัวเลข user adoption / completion-rate / time-on-task ยังไม่มี — owner จะ qualitative-test เอง

## Proposed Solution

รื้อเว็บแอพ `early-retire` เป็น **6-step mobile-first wizard** บนดีไซน์ "calm fintech" (subtle gradient + solid data surfaces + motion ≤300ms + reduced-motion respect + single-column ≤640px). Mode-first flow: เลือก กบข./ไม่ กบข. ก่อน → ข้อมูลส่วนตัว → เวลาราชการ (multiplier conditional ตามวันบรรจุ + leave deduction ที่ทำงานจริง) → ประวัติเลื่อนเงินเดือน (เฉพาะ % ตัด position UI ออก) → การคำนวณ (ตาราง editable per-row: ระดับตำแหน่ง + วันที่มีผล + auto-recalc) → ผลลัพธ์ (โชว์ทุกก้อนเสมอ + พิมพ์ A4). DatePicker calendar overlay พ.ศ. ใช้ทุกช่อง. ทำเสร็จในวันเดียวด้วย Claude pair-programming

## Key Hypothesis

**เราเชื่อว่า** การให้ข้าราชการใกล้เกษียณคำนวณบำเหน็จบำนาญเองได้บนมือถือใน 5 นาที พร้อมตารางคำนวณที่แก้ทุกแถวได้

**จะช่วยให้** พวกเขาตัดสินใจเรื่องเกษียณก่อนกำหนด / รับบำเหน็จ-หรือบำนาญ ได้อย่างมั่นใจโดยไม่ต้องไปขอ HR

**เราจะรู้ว่าสำเร็จเมื่อ** Owner ทดสอบเองครบ flow บนมือถือ + functional requirement 1-8 ผ่านทุกข้อ + ตัวเลข output ตรงกับ Excel template เดิมในกรณีตัวอย่าง 3-5 ราย

## What We're NOT Building

- **Eligibility check ตามอายุ/ปีราชการ** — defer ไป Phase 2 รุ่นถัดไป; ใช้ disclaimer แทนในรอบนี้
- **Dark mode** — Gaps&Questions Q8 "light first"
- **Export PDF เต็ม** (เกินกว่า `window.print()`) — ใช้ print stylesheet พอ
- **Position-name dropdown** — ตัดออกตาม requirement #2 ที่ owner ยืนยัน
- **A11y audit เต็ม + ARIA** — ทำแค่ baseline WCAG 2.2 AA (contrast + reduced-motion + tap targets)
- **Tooltip ทุกฟิลด์** — เฉพาะจุดที่สำคัญ
- **Backend / database / admin / multi-user** — out of scope ตลอด
- **รองรับข้าราชการนอก สป.ยธ.** — สูตร/ฐานข้อมูลตำแหน่งจำกัดเฉพาะหน่วยงานนี้

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Functional req 1-8 ผ่านทุกข้อ | 8 / 8 | Manual smoke test by owner ตาม checklist |
| ตัวเลข output ตรงกับ Excel | 100% สำหรับ 3-5 ตัวอย่าง | Cross-check ทั้ง gfp + non-gfp scenarios |
| Mobile completion time | ≤ 5 นาที | Owner self-test on phone |
| Visual feel | "calm fintech" — owner accepts | Owner qualitative judgment |
| Existing E2E smoke pass | All green | `npx playwright test` |
| TypeScript + lint + build | All pass | CI gate (`tsc --noEmit` + `npm run lint` + `npm run build`) |
| WCAG baseline | Contrast 4.5:1 + reduced-motion | Manual contrast spot-check + reduced-motion test |

## Open Questions

- [ ] Print stylesheet สมบูรณ์แค่ไหน — "พิมพ์ A4 อ่านได้" หรือ "preview-perfect"? Owner ตัดสินตอนทำ
- [ ] Animated number counters: vanilla CSS counter-reset หรือ Framer Motion `useMotionValue`?
- [ ] Deferred items (eligibility, dark mode, PDF เต็ม) เก็บเป็น GitHub issues หรือ TODO comments?
- [ ] Disclaimer ที่ Footer — wording ที่ owner รับได้ ("ผลคำนวณเป็นการประมาณการเบื้องต้น โปรดตรวจสอบกับกองบริหารทรัพยากรบุคคลอีกครั้งก่อนตัดสินใจ" — owner approve?)

---

## Users & Context

### Primary User

- **Who**: ข้าราชการสำนักงานปลัดกระทรวงยุติธรรม **อายุตัว 50+ / อายุราชการ 25+**
- **Current behavior**: ใช้ LINE / Facebook / แอพธนาคาร (KMA, SCB Easy) ได้ แต่ไม่คุ้นกับเครื่องมือคำนวณการเงิน. ปัจจุบัน "เดินไปถามเจ้าหน้าที่ HR ให้เปิด Excel ให้"
- **Trigger**: ได้ยินเฟกนิวส์เรื่องเกษียณก่อนกำหนด → กังวล/เร่งด่วน → หยิบมือถือเข้าเว็บนี้
- **Context การใช้**: First-time user, ไม่ได้ training, อ่านบนหน้าจอมือถือไม่กี่นิ้ว
- **Success state**: เห็นตัวเลข 3 ก้อน (บำเหน็จก้อน + บำนาญรายเดือน + บำเหน็จดำรงชีพ 3 รอบ) ใน 5 นาที + รู้สึก "เว็บนี้น่าเชื่อถือพอที่จะใช้ตัดสินใจ"

### Secondary User

- ข้าราชการอายุน้อย-กลาง (30-45) ที่อยากลองคำนวณ "ถ้าฉันเลือก กบข ดีไหม" หรือ "ถ้าฉันเกษียณตอน 25 ปี"
- design ไม่กีดกัน แต่ทุก default (ฟอนต์ขนาด ≥16px, tap target ≥44px, motion ต่ำ, gesture ไม่บังคับ) optimize for primary

### Job to Be Done

> **เมื่อ** ฉันได้ยินข่าวเรื่องโครงการเกษียณก่อนกำหนด หรือกำลังวางแผนการเงินก่อนเกษียณ
> 
> **ฉันต้องการ** คำนวณบำเหน็จ + บำนาญ + บำเหน็จดำรงชีพของตัวเองบนมือถือใน 5 นาที (โดยไม่ต้องเปิด Excel หรือไปขอเจ้าหน้าที่ HR)
>
> **เพื่อจะ** ตัดสินใจได้ว่าควรเกษียณก่อน/ไม่, รับบำเหน็จ/บำนาญ, จะได้เงินจริงพอใช้ไหม

### Non-Users

- **HR power users ที่ใช้ Excel เดิม** — Excel ทำงานได้ ไม่จำเป็นต้อง migrate
- **ผู้บริหารต้องการ dashboard หลายคน** — เครื่องมือนี้เป็น self-service รายบุคคล ไม่ใช่ admin tool
- **ข้าราชการนอก สป.ยธ.** — ฐานข้อมูลตำแหน่งใน `salary-bases.json` จำกัดเฉพาะหน่วยงาน
- **ลูกจ้าง/พนักงานราชการที่ไม่ใช่ข้าราชการประจำ** — สูตรไม่ครอบคลุม
- **ผู้ใช้บนเดสก์ท็อปเป็นหลัก** — mobile-first; desktop = "mobile shell ที่อยู่กลางจอ"

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| **Must** | Mode Select Step 0 (กบข./ไม่ กบข.) ก่อนทุกอย่าง | Req #1 — เปลี่ยน flow หลัก, ตัด toggle ที่หน้าผลลัพธ์ออก |
| **Must** | DatePicker calendar overlay พ.ศ. ใช้ทุกที่ | Req #3 + decision Phase 4 (datepicker ทุกช่อง รวมถึง custom retirement) |
| **Must** | Retirement option: default-then-override (เกษียณ/25-ปี/กำหนดเอง — ทุก option แสดงใน datepicker ที่แก้ได้) | Req #4 + Phase 4 trust pattern |
| **Must** | Multiplier conditional rendering ตามวันบรรจุ | Req #5-6 — ก่อนช่วงทวีคูณ → แสดง + หักวันลา; หลังช่วงทวีคูณทั้งหมด → ซ่อน, ให้เพิ่มเอง |
| **Must** | Leave deduction logic ทำงานจริง (หักจาก totalDays) | Req #5 + decision Phase 6.1 (existing bug fix) |
| **Must** | Step 3 = "ประวัติเลื่อนเงินเดือน" — ลบ position UI ครึ่งบน เก็บ % เลื่อน + เงินเดือน | Req #2 ตัด position + Req #7 rename |
| **Must** | Step 4 = "การคำนวณ" — editable rows: ระดับตำแหน่ง dropdown + วันที่มีผล datepicker + auto-recalc cells | Req #6 + Req #7 rename + Req #8 columns |
| **Must** | ตารางคำนวณ scope ตาม mode: GPF = 60-month window, non-GPF = latest round → retirement | Req #8 |
| **Must** | คอลัมน์ตาราง: วันที่มีผล / ระดับ / เงินเดือนเดิม / ขั้นสูง / ฐาน / % (warn ใช้เฉลี่ยถ้ายังไม่ถึง) / เลื่อนจริง / ใหม่ | Req #8 |
| **Must** | ผลลัพธ์โชว์ทุกก้อนเสมอ (บำเหน็จก้อน + บำนาญ + บำเหน็จดำรงชีพ 3 รอบ) | Phase 3 decision — no eligibility filter |
| **Must** | Calm fintech baseline: gradient on chrome only, solid data surfaces, motion ≤300ms + `prefers-reduced-motion`, single column ≤640px | UI research — glass บน data = WCAG fail สำหรับ 55+ |
| **Must** | ProgressBar 6 ขั้น พร้อม rename labels | Req #7 + Step 0 |
| **Must** | Footer + disclaimer "กองบริหารทรัพยากรบุคคล สำนักงานปลัดกระทรวงยุติธรรม" + "ผลคำนวณเป็นการประมาณการ..." | Trust signal + risk mitigation (no eligibility filter) |
| **Must** | localStorage silent migration ผ่าน `__schemaVersion` | Decision Phase 6.2 |
| **Must** | Print stylesheet (`@media print`) ที่หน้า A4 ดูสวย | Decision Phase 6.3 |
| **Should** | Animated number counters บน hero stats | Wealthfront-style trust pattern, ถ้าทันเวลา |
| **Should** | Tooltip help text บน "ฐาน", "ขั้นสูง", "% เฉลี่ย" | Gaps&Questions Q10 |
| **Could** | Hover/focus polish บน components | UI delight |
| **Won't** | Eligibility check ตามอายุ/ปีราชการ | Phase 3 decision; defer |
| **Won't** | Dark mode | "light first" |
| **Won't** | Export PDF/email/share-link | beyond `window.print()` |
| **Won't** | Position-name dropdown + level-category radio | Req #2 ตัดออก |
| **Won't** | Animation บน every row hover | Vestibular harm สำหรับ 55+ |
| **Won't** | Backend / database / admin / multi-user | ตลอด |

### MVP Scope

6-step mobile-first wizard ที่ครอบ **functional requirement 1-8 ของ owner** + **calm fintech baseline** ที่ผ่าน WCAG AA contrast + เคารพ `prefers-reduced-motion`. ทุก Must items ข้างบนต้องเสร็จในวันเดียว. Should items เพิ่มถ้าทันเวลา. Won't items lock ไว้

### User Flow

```
[Open URL on mobile]
   ↓
[Step 0: Mode Select] ← เลือก กบข. / ไม่ กบข.
   ↓
[Step 1: ข้อมูลส่วนตัว] ← วันเกิด + วันบรรจุ + วันพ้นราชการ (3 options + datepicker แก้ได้)
   ↓
[Step 2: เวลาราชการ] ← Show base service period + multiplier (conditional) + leave deduction
   ↓
[Step 3: ประวัติเลื่อนเงินเดือน] ← เงินเดือนปัจจุบัน + 6 รอบ % เลื่อน + ค่าเฉลี่ย
   ↓
[Step 4: การคำนวณ] ← ตาราง editable: ระดับ/วันที่มีผล/% เลื่อน + auto-recalc
   ↓
[Step 5: ผลลัพธ์] ← บำเหน็จก้อน + บำนาญรายเดือน + บำเหน็จดำรงชีพ 3 รอบ + พิมพ์
```

Critical path บนมือถือ ≤5 นาที. ผู้ใช้สามารถ scroll back / แก้ขั้นก่อนหน้าได้ตลอด (state persist ผ่าน localStorage)

---

## Technical Approach

**Feasibility**: **MEDIUM-HIGH** สำหรับ 1-day completion ด้วย Claude pair-programming

### Architecture Notes

- **Stack lock-in**: Next.js 16 App Router + React 19 + TypeScript strict + Tailwind 4 + Framer Motion + Lucide React + Noto Sans Thai. ไม่เปลี่ยน
- **Data layer**: คงเป็น static JSON (`data/salary-bases.json`, `data/position-map.json`, `data/rules.json`). ไม่มี backend, ไม่มี API
- **State management**: คง pattern "page.tsx เป็น single source of truth + useMemo chain". รื้อ chain ให้รับ `salaryOverrides[]`
- **Pure functions ใน `lib/calculations.ts`** ใช้ต่อเกือบทั้งหมด — ปรับ 2 signatures:
  - `calculateServicePeriod(start, end, leaveDays?)` — เพิ่ม optional leave subtraction
  - `generateSalaryTable(..., overrides[])` — รับ per-row level + effectiveDate overrides แทน derived
- **localStorage migration**: เพิ่ม `__schemaVersion: 2` ใน FormState; mount-time check; mismatch → `localStorage.removeItem("early-retire-form")` (silent clear)
- **DatePickerTH**: rewrite จาก 3-input boxes → calendar overlay พ.ศ. + keyboard fallback. New component `components/ui/CalendarPickerTH.tsx`
- **Visual tokens**: เพิ่มใน `app/globals.css` — gradient mesh tokens, easing tokens (ease-out-expo, spring), elevation system, calm fintech palette (navy #1e3a5f → indigo #3949ab gradient on chrome only)
- **A11y baseline**: contrast 4.5:1, tap targets ≥44px, `@media (prefers-reduced-motion: reduce)` disables transform/opacity-only animations

### Technical Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| DatePicker calendar overlay ใช้เวลานานเกิน | M | Phase 2A parallel กับ 2B; fallback = ปรับ 3-input style ของเดิมให้ดูดีขึ้น (lock 2 ชม. แล้วถ้าไม่เสร็จ→ fallback) |
| State migration break legacy users | L | Silent clear ถ้า `__schemaVersion` mismatch — เสีย UX ครั้งเดียว, ปลอดภัย 100% |
| Salary table editable recalc loop / perf | M | useMemo dependency = `[salaryOverrides, currentSalary, mode, salaryBases]`; แต่ละ row recalc lazy |
| Calm fintech polish ไม่ทันใน 1 วัน | M | MoSCoW lock — Must items ต้องผ่าน, Should items skip ได้; ระบุ time-box ต่อ phase |
| WCAG fail บน gradient overlay | L | Glass บน chrome เท่านั้น; data card ใช้ solid bg-white + soft shadow; spot-check contrast ระหว่างทาง |
| Multiplier conditional logic ผิด | M | เขียน test ใน e2e: case (start ก่อน period) vs (start หลัง period) |
| Leave deduction ผิดสูตร | M | Cross-check ตัวเลขกับ Excel template ที่มี (3-5 ตัวอย่าง) |
| ตัด scope ผิดที่ → req fail | M | Owner reviews PRD ก่อน implement; checkpoint ทุก phase |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases that can run concurrently (e.g., "with 3" or "-")
  DEPENDS: phases that must complete first (e.g., "1, 2" or "-")
  PRP: link to generated plan file once created
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Foundation & Design Tokens | `globals.css` (gradient/motion/elevation tokens), `types/index.ts` (mode/overrides/schemaVersion), `lib/calculations.ts` (leave deduction + overrides signatures) | in-progress | - | - | `.claude/PRPs/plans/phase-1-foundation.plan.md` |
| 2A | DatePickerTH Rewrite | New `components/ui/CalendarPickerTH.tsx` — calendar overlay พ.ศ. + keyboard fallback + reduced-motion aware | pending | with 2B | 1 | `.claude/PRPs/plans/phase-2a-datepicker.plan.md` |
| 2B | UI Primitives Update | Button/Card/Input/Tooltip refresh + new `SegmentedControl` + `ProgressBar` 6-step rename | pending | with 2A | 1 | `.claude/PRPs/plans/phase-2b-ui-primitives.plan.md` |
| 3 | Step Components Refactor | new `ModeSelect.tsx` + rewrite all 5 existing sections per requirements | pending | - | 2A, 2B | `.claude/PRPs/plans/phase-3-step-components.plan.md` |
| 4 | Page Wiring + State Migration | `app/page.tsx` 6-step flow + `__schemaVersion` silent migration + useMemo refactor | pending | - | 3 | `.claude/PRPs/plans/phase-4-page-wiring.plan.md` |
| 5 | Print Stylesheet + Polish | `@media print`, animated counters (Should), tooltips (Should) | pending | with 6 | 4 | `.claude/PRPs/plans/phase-5-print-polish.plan.md` |
| 6 | E2E Update + Manual QA | Update `e2e/smoke.spec.ts` for 6-step flow + manual checklist req 1-8 + cross-check Excel | pending | with 5 | 4 | `.claude/PRPs/plans/phase-6-e2e-qa.plan.md` |

### Phase Details

**Phase 1: Foundation & Design Tokens**
- **Goal**: Lock โครงสร้าง type, utilities, design tokens ก่อน UI work — ทุก UI phase ต้อง build บน foundation นี้
- **Scope**:
  - `app/globals.css`: เพิ่ม gradient mesh tokens (navy → indigo), easing tokens (`--ease-out-expo`, `--ease-spring`), elevation system (e1-e4), calm fintech palette refresh, `@media (prefers-reduced-motion: reduce)` overrides
  - `types/index.ts`: refactor `FormState` — ลบ `position`, `levelCategory`, `viewMode`. เพิ่ม `mode: "gfp" | "non-gfp" | null`, `salaryOverrides: Array<{ effectiveDate: string|null; level: string|null }>`, `__schemaVersion: number`
  - `lib/calculations.ts`:
    - `calculateServicePeriod(start, end, leaveDays?)` — รับ optional `leaveDays` แล้วลบ `totalDays` ก่อนคำนวณ `totalYears`
    - `generateSalaryTable(...args, overrides[])` — รับ per-row override `{ effectiveDate, level }` ที่ override default; recalc base/maxSalary/increase/newSalary ตาม level ของแถวนั้น
    - เพิ่ม helper `getMaxSalaryForLevel(level)` และ `selectBaseForSalary(salary, baseInfo)`
- **Success signal**: TypeScript + lint pass; existing E2E ยังพอผ่าน (อาจ skip บางส่วนชั่วคราว)
- **Time-box**: 1.5 ชม.

**Phase 2A: DatePickerTH Rewrite**
- **Goal**: Calendar overlay พ.ศ. ใช้ทุกฟิลด์ date ในแอพ
- **Scope**: เขียน `components/ui/CalendarPickerTH.tsx` ใหม่
  - Trigger button + calendar popover (Framer Motion `AnimatePresence` + reduced-motion aware)
  - Month navigation พ.ศ. (จาก 2400-2600)
  - Day grid (Mon-Sun start, Buddhist month names)
  - Keyboard input fallback ใต้ calendar (3 inputs เดิม)
  - Same API: `value: ISO string | null`, `onChange: (iso) => void`, `label`, `helper`, `error`, `required`
  - Replace `components/DatePickerTH.tsx` (deprecate)
- **Success signal**: Drop-in replacement ใน `PersonalInfoForm`; ค่าออกมาเป็น ISO string เหมือนเดิม
- **Time-box**: 2 ชม.

**Phase 2B: UI Primitives Update**
- **Goal**: Calm fintech baseline บน components ที่ reuse บ่อย
- **Scope**:
  - `components/ui/Button.tsx`: gradient primary, solid secondary, large tap target ≥44px, ripple on tap (subtle)
  - `components/ui/Card.tsx`: solid surface (white) + optional gradient header slot + soft shadow (e2)
  - `components/ui/Input.tsx`: large height (44px), focus ring, label inside option
  - `components/ui/Tooltip.tsx`: keyboard accessible, focus-visible only, no hover-only
  - **New** `components/ui/SegmentedControl.tsx`: สำหรับ Mode Select + retirement option toggle
  - `components/ProgressBar.tsx`: 6-step layout + rename labels (`["เลือกประเภท", "ข้อมูลส่วนตัว", "เวลาราชการ", "ประวัติเลื่อนเงินเดือน", "การคำนวณ", "ผลลัพธ์"]`)
- **Success signal**: Visual sanity check ใน existing screens ก่อน Phase 3
- **Time-box**: 1.5 ชม.

**Phase 3: Step Components Refactor**
- **Goal**: ทุก section ทำ requirement 1-8 ครบ
- **Scope**:
  - **New** `app/sections/ModeSelect.tsx` (Step 0): 2 large card-buttons "เป็นสมาชิก กบข." vs "ไม่เป็นสมาชิก กบข." + cap onClick → updateForm({ mode })
  - `PersonalInfoForm.tsx`: ใช้ CalendarPickerTH ใหม่ทั้ง 3 ช่อง + retirement option default-then-override pattern (button → setEndDate(default) → user แก้ใน picker → flip option = "custom")
  - `ServicePeriodForm.tsx`:
    - Conditional rendering: ถ้า `startDate < period.startDate` → แสดง default multiplier period; else hide
    - CalendarPickerTH สำหรับ multiplier dates แทน HTML5 date input
    - Leave deduction inputs ส่งไป `calculateServicePeriod` (Phase 1 logic)
  - `SalaryHistoryForm.tsx` (rename → "ประวัติเลื่อนเงินเดือน"): ลบ position dropdown + levelCategory + level chips + base info card. เก็บแค่ `currentSalary` + 6 รอบ % + average
  - `SalaryTable.tsx` (rename → "การคำนวณ"): editable rows
    - Level dropdown (จาก `salaryBases.map(b => b.level)`)
    - CalendarPickerTH วันที่มีผลต่อแถว
    - Auto-recalc base/maxSalary/increase/newSalary on change
    - Mode-aware scope: GPF → 60-month back; non-GPF → latest round → retirement
    - Warn ถ้า % เลื่อนยังไม่กำหนด → ใช้ค่าเฉลี่ย
  - `ResultSection.tsx`: ลบ mode toggle, show ทั้ง 3 ก้อนเสมอ, เพิ่ม disclaimer + footer ภายใน + print-ready layout
- **Success signal**: Click through 6 ขั้นโดยไม่มี runtime errors; ตัวเลขตรงกับสูตรเดิม (1 sample manual check)
- **Time-box**: 2.5 ชม.

**Phase 4: Page Wiring + State Migration**
- **Goal**: 6-step flow + safe state migration
- **Scope**:
  - `app/page.tsx`:
    - `CURRENT_SCHEMA_VERSION = 2` constant
    - Mount: parse localStorage → ถ้า `parsed.__schemaVersion !== CURRENT_SCHEMA_VERSION` หรือไม่มี → `localStorage.removeItem(...)` + ใช้ initialForm
    - 6-step `steps` array (Mode Select → 5 sections)
    - Lock progress: ถ้า `mode === null` ห้ามไป step ≥1
    - useMemo chain refactor: `salaryRecords` คำนวณจาก `mode + currentSalary + assessmentIncreases + endDate + salaryOverrides`
    - `nonGfpResult` / `gfpResult` คำนวณ ตาม `mode` ที่ user เลือก (ลบ "compute both, toggle on result page")
    - Save updated form กับ `__schemaVersion` ทุกครั้ง
- **Success signal**: Wizard ใช้ได้ครบ 6 ขั้น; legacy localStorage ผู้ใช้เก่า → silent clear, mount fresh
- **Time-box**: 1 ชม.

**Phase 5: Print Stylesheet + Polish**
- **Goal**: หน้าผลลัพธ์พิมพ์ A4 ดูดี + delight detail
- **Scope**:
  - `app/globals.css` `@media print`:
    - hide `nav`, `button`, `.no-print`, social share, progress bar
    - expand all collapsed cards
    - sensible page-breaks (`break-inside: avoid` บน hero stats)
    - Black-on-white กลับสู่ตัวอักษรที่อ่านได้
  - Animated number counters (Should) บน hero stats — Framer `useMotionValue` + `useTransform`
  - Tooltip help บน "ฐาน", "ขั้นสูง", "% เฉลี่ย" (Should)
- **Success signal**: Browser print preview สวย; counters animate ≤300ms
- **Time-box**: 1 ชม.

**Phase 6: E2E Update + Manual QA**
- **Goal**: Verify ทั้งหมดทำงาน
- **Scope**:
  - Update `e2e/smoke.spec.ts`: เริ่มจาก Mode Select click → flow ใหม่ทั้งหมด → assert ผลลัพธ์ครบ 3 ก้อน
  - เพิ่ม test: multiplier conditional (start before/after period); leave deduction ผลกระทบ totalServiceYears
  - **Manual checklist req 1-8**:
    - [ ] เลือก mode ก่อน
    - [ ] ระดับตำแหน่งเลือกเฉพาะใน Step 4 ตาราง
    - [ ] DatePicker พ.ศ. ทุกที่
    - [ ] 3 retirement options ทำงาน + datepicker แก้ override ได้
    - [ ] Multiplier conditional + leave deduction ทำงานจริง
    - [ ] ตาราง editable ทุกแถว
    - [ ] Step labels ตรงตามที่ rename
    - [ ] Step 4 columns ครบ + warn % เฉลี่ย
  - Cross-check ตัวเลข 3-5 cases กับ Excel template
- **Success signal**: All E2E pass; manual checklist 100%; ตัวเลขตรง Excel
- **Time-box**: 1 ชม.

### Parallelism Notes

- **Phase 1 ต้องเสร็จก่อน** (foundation lock)
- **Phase 2A + 2B run parallel** — components isolated; ไม่กระทบกัน
- **Phase 3 ต้องรอทั้ง 2A และ 2B**
- **Phase 4 ต้องรอ 3** (page wiring depends on sections)
- **Phase 5 + Phase 6 parallel** — Phase 5 เป็น polish, Phase 6 เป็น verification; ทำงานคนละไฟล์
- **Critical path**: 1 → (2A ‖ 2B) → 3 → 4 → (5 ‖ 6) ≈ **8.5 ชม. estimate** (1.5 + max(2,1.5) + 2.5 + 1 + max(1,1))

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Mode-first flow | Step 0 = Mode Select | Toggle ที่หน้าผลลัพธ์ (เดิม) | Req #1 + ลด cognitive load |
| ตัด position dropdown | ระดับตำแหน่งเลือกเฉพาะในตาราง | คงไว้ + override per row | Req #2 — owner explicit decision |
| DatePicker ทุกฟิลด์ | Calendar overlay พ.ศ. | year-as-number + slider (research recommend) | Owner ปฏิเสธ research recommendation; trust pattern "calculate, then expose" |
| Retirement option | default-then-override (ปุ่ม → set default → datepicker แก้) | Picker only / Option only | Owner Phase 4 decision |
| Layout | Mobile-first single column ≤640px ทั้งสองจอ | Hybrid (desktop=single-page, mobile=wizard) | Owner decision overrides Gaps&Questions Q4 |
| ผลลัพธ์ | โชว์ทุกก้อนเสมอ | Filter ตามอายุ/ปีราชการ | Phase 3 decision; defer eligibility |
| User audience | A: Primary 50+, secondary 30-45 | B: All ages equal | Owner Phase 4 decision |
| Visual direction | Calm fintech (gradient on chrome only, solid data, motion ≤300ms) | Heavy glassmorphism / formal institutional | UI research: glass + low contrast = WCAG fail สำหรับ 55+ (Axess Lab); reduced-motion mandatory (WCAG 2.3.3) |
| Trust signal | ชื่อ "กองบริหารทรัพยากรบุคคล" + disclaimer | ตรากระทรวงยุติธรรม | Owner decision — ลด asset/legal risk; เพิ่ม strong disclaimer ทดแทน |
| Leave deduction | แก้ให้หักจริง | Defer Phase 2 | Owner Phase 6 decision (ก) — fix existing bug |
| localStorage migration | Silent clear ถ้า schema mismatch | Best-effort merge | Owner Phase 6 decision (ก) — simpler, safer |
| Print stylesheet | อยู่ใน scope รอบนี้ | Defer | Owner Phase 6 decision (ก) |
| Eligibility check | Out of scope | In-scope w/ disclaimer | Phase 3 decision; defer |
| Dark mode | Won't | Phase 2 | Gaps&Questions Q8 "light first" |
| Position-name dropdown | Removed | Keep | Req #2 ตัดออก |
| Tech stack | Lock Next 16 + React 19 + Tailwind 4 + Framer + Lucide | เปลี่ยน framework | Already invested; 1-day budget |

---

## Research Summary

### Market Context

**Reference apps ที่ทำ "fintech smooth สำหรับคนอายุเยอะ" สำเร็จ** (จาก agent web research)
- **Wealthfront Path**: clean white/teal, real-time graph feedback บน slider, ไม่ใช้ glass บน data ([goodux.appcues.com](https://goodux.appcues.com/blog/wealthfront-personalized-ux-copy))
- **Betterment**: Gilroy bold + ใหญ่, muted blue-green, ไม่มี frosted-glass บน data screens ([rondesignlab.com](https://rondesignlab.com/cases/betterment-finance-app-ux-ui-design))
- **Fidelity UK Retirement Calculator**: multi-section wizard, scenarios แยกเป็น labeled cards (ไม่ใช่ overlay) ([fidelity.co.uk](https://www.fidelity.co.uk/retirement/calculators/retirement-calculator/))

**Mobile pension calculator patterns**
- Wizard-then-refine เป็น norm (Fidelity, SmartAsset)
- Side-by-side card comparison สำหรับ scenarios
- Numeric text + slider %; year-as-number ไม่ใช้ datepicker (owner ปฏิเสธ — เลือกใช้ datepicker)

**Risks ของ glass/motion สำหรับ 55+**
- WCAG 2.2 contrast 4.5:1; glass บน gradient มัก fail ([axesslab.com](https://axesslab.com/glassmorphism-meets-accessibility-can-frosted-glass-be-inclusive/))
- WCAG 2.3.3: motion ต้อง disable ได้ — vestibular harm ([w3.org](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html))
- Hand tremor + visual acuity: tap targets ≥44px, no gesture-only ([PMC 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12350549/))

**Thai gov UX = ยัง conservative ทั้งหมด** (จาก research)
- SSO (sso.go.th), กรมสรรพากร (rd.go.th), Krungthai NEXT — ไม่มีตัวไหนใช้ premium fintech direction
- เว็บนี้จะเป็น **first mover** ใน Thai gov fintech-style — มี trust risk + opportunity

### Technical Context

- **Codebase**: Next.js 16 + React 19 + TS strict + Tailwind 4 + Framer + Lucide (locked)
- **Pure functions ใน `lib/calculations.ts`** ใช้ต่อทั้งหมด — refactor 2 signatures (leave deduction + overrides)
- **DatePickerTH** ปัจจุบันเป็น 3-input boxes ไม่ใช่ calendar — ต้อง rewrite เป็น calendar overlay พ.ศ.
- **Leave deduction**: existing UI bug — fields เก็บค่า แต่ `calculateServicePeriod` ไม่หัก. fix ใน Phase 1
- **Mobile card pattern + AnimatePresence wizard transition + Noto Sans Thai font** ใช้ต่อได้
- **Single source of truth pattern** ใน `app/page.tsx` (useState + useMemo chain) ใช้ต่อได้

---

*Generated: 2026-04-26*
*Status: DRAFT — needs implementation validation by owner self-test*
*Owner: arnutt.n@gmail.com (single-developer with Claude pair-programming)*
*Timeline: Same-day completion target*
