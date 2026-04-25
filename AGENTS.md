# AGENTS.md — Early Retire (คำนวณบำเหน็จบำนาญ)

ไฟล์นี้เขียนขึ้นเพื่อให้ AI coding agent เข้าใจโครงสร้าง สถาปัตยกรรม และข้อตกลงการพัฒนาของโปรเจกต์นี้ อย่าสรุปสิ่งที่ไม่ได้ระบุในโค้ดหรือไฟล์จริง

---

## 1. ภาพรวมโปรเจกต์

**Early Retire** เป็นเว็บแอปพลิเคชันสำหรับคำนวณบำเหน็จบำนาญของข้าราชการ (เฉพาะสำนักงานปลัดกระทรวงยุติธรรม) แบบ 2 กรณี:
- **กรณี A (non-gfp):** ไม่เป็นสมาชิก กบข. — ใช้เงินเดือนเดือนสุดท้าย
- **กรณี B (gfp):** เป็นสมาชิก กบข. — ใช้เงินเฉลี่ย 60 เดือนสุดท้าย

ผู้ใช้กรอกข้อมูลผ่าน Step Wizard 5 ขั้นตอน ระบบคำนวณเงินบำเหน็จ (ก้อน) เงินบำนาญรายเดือน และบำเหน็จดำรงชีพ (แบ่ง 3 ครั้ง) จากนั้นแสดงผลลัพธ์พร้อมเปรียบเทียบ 2 กรณี

---

## 2. Technology Stack

| เทคโนโลยี | รายละเอียด |
|---|---|
| **Framework** | Next.js 16.2.4 (App Router) |
| **React** | 19.2.4 |
| **Language** | TypeScript 5 (strict mode) |
| **Styling** | Tailwind CSS 4 + PostCSS |
| **Animation** | Framer Motion 12.38.0 |
| **Icons** | Lucide React |
| **Font** | Noto Sans Thai (Google Fonts via `next/font`) |
| **Build Tool** | Turbopack (เริ่ม dev ด้วย `next dev`) |
| **Linting** | ESLint 9 + `eslint-config-next` (core-web-vitals + typescript) |
| **Deploy Target** | Vercel (Static / Node.js runtime) |

**หมายเหตุ:** ไม่มี backend API หรือ database ปัจจุบันใช้ static JSON files เป็น data layer ทั้งหมด

---

## 3. โครงสร้างโปรเจกต์

```
early-retire/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout + Metadata + Font
│   ├── page.tsx                  # Landing + Step Wizard (หน้าหลัก)
│   ├── error.tsx                 # Global error boundary (client)
│   ├── globals.css               # Tailwind import + CSS variables + animations
│   ├── favicon.ico
│   └── sections/                 # 5 Step Components
│       ├── PersonalInfoForm.tsx  # ขั้นตอน 1: ข้อมูลส่วนตัว + วันเกษียณ
│       ├── ServicePeriodForm.tsx # ขั้นตอน 2: เวลาราชการ + ทวีคูณ + หักวันลา
│       ├── SalaryHistoryForm.tsx # ขั้นตอน 3: ตำแหน่ง + เงินเดือน + % เลื่อน
│       ├── SalaryTable.tsx       # ขั้นตอน 4: ตารางเงินเดือน
│       └── ResultSection.tsx     # ขั้นตอน 5: ผลลัพธ์บำเหน็จบำนาญ
├── components/                   # Shared components
│   ├── DatePickerTH.tsx          # Date picker รูปแบบ พ.ศ. (3 ช่อง input)
│   ├── Footer.tsx                # Footer สำนักงานปลัดกระทรวงยุติธรรม
│   ├── ProgressBar.tsx           # Progress bar 5 ขั้นตอน (desktop + mobile)
│   ├── SocialShare.tsx           # ปุ่มแชร์ Facebook / Line / X / Copy link
│   └── ui/                       # Reusable UI primitives
│       ├── Button.tsx            # Motion button (variants: primary/secondary/outline/ghost)
│       ├── Card.tsx              # Motion card with hover effect
│       ├── Input.tsx             # Text/number/date input with suffix
│       └── Tooltip.tsx           # Accessible tooltip (Framer Motion)
├── hooks/
│   └── useLocalStorage.ts        # Hook สำหรับ persist state ลง localStorage
├── lib/
│   ├── calculations.ts           # สูตรคณิตศาสตร์บำนาญ + generateSalaryTable
│   └── utils.ts                  # Helpers: cn (clsx+tailwind-merge), พ.ศ.↔ค.ศ., formatNumber, roundUp10
├── data/                         # Static JSON data (data layer)
│   ├── salary-bases.json         # ฐานเงินเดือนแต่ละระดับ (fullSalary, baseTop, baseBottom, baseMid)
│   ├── position-map.json         # แผนที่ตำแหน่งงาน → ระดับตำแหน่ง
│   └── rules.json                # กฎเกณฑ์คำนวณ (เกษียณ, ทวีคูณ, สูตรบำนาญ)
├── types/
│   └── index.ts                  # TypeScript interfaces (FormState, SalaryRecord, PensionResult, ...)
├── public/                       # Static assets (favicon, svg)
├── docs/                         # เอกสารประกอบ + Excel template
├── package.json
├── next.config.ts                # Next.js config (default เกือบทั้งหมด)
├── tsconfig.json                 # TypeScript strict, path alias `@/*`
├── eslint.config.mjs             # ESLint ใช้ nextVitals + nextTs presets
├── postcss.config.mjs            # PostCSS + Tailwind
└── .env.example                  # Environment variables template (ว่างเปล่าเกือบทั้งหมด)
```

---

## 4. คำสั่ง Build และ Development

```bash
# Development (Turbopack)
npm run dev

# Production build
npm run build

# Production server (ต้อง build ก่อน)
npm run start

# Lint
npm run lint
```

Default dev server: `http://localhost:3000`

---

## 5. ข้อตกลงการเขียนโค้ด (Code Style & Conventions)

### 5.1 TypeScript
- **Strict mode** เปิดใช้งาน (`"strict": true` ใน tsconfig)
- ใช้ **path alias** `@/` สำหรับ import จาก root (เช่น `@/lib/utils`, `@/components/ui/Button`)
- ไฟล์ type แยกอยู่ใน `types/index.ts` แต่บาง interface ยังอยู่ใน `lib/calculations.ts` ด้วย

### 5.2 React Components
- **ทุก component ที่มี interaction เป็น Client Component** (`"use client"` ที่บรรทัดแรก) เพราะใช้ hooks (`useState`, `useMemo`, `useCallback`, `useEffect`) และ Framer Motion
- ไม่มี Server Component ที่ซับซ้อน (นอกจาก `layout.tsx` ที่เป็น server โดยธรรมชาติ)
- Props interface ตั้งชื่อว่า `Props` หรือ `{ComponentName}Props`

### 5.3 Styling
- ใช้ **Tailwind CSS utility classes** เป็นหลัก
- **CSS Variables** กำหนดใน `:root` ภายใน `globals.css` แล้ว expose ผ่าน `@theme inline`
- สีหลักคือ `--color-primary: #1e3a5f` (น้ำเงินเข้ม)
- มี custom animation utilities ใน `globals.css` (`.animate-fade-in-up`, `.animate-slide-in-right`, etc.)
- `cn()` utility จาก `lib/utils.ts` ใช้สำหรับ merge Tailwind classes

### 5.4 Icons
- ใช้ **Lucide React** เท่านั้น (`lucide-react`)

### 5.5 Date Handling
- ภายใน logic ใช้ `Date` object แบบ ISO string (`toISOString()`)
- UI แสดงผลเป็น **พ.ศ.** (Buddhist Era) โดยใช้ helper `toBE()` / `toCE()` (offset = 543)
- `DatePickerTH` แยก input เป็น 3 ช่อง: วว / ดด / ปปปป (พ.ศ.) แล้ว validate ก่อน parse เป็น Date

---

## 6. State Management และ Data Flow

### 6.1 Global State
- ใช้ **React `useState`** บน `page.tsx` (top-level) เป็น single source of truth
- Form state มี type `FormState` (อยู่ใน `types/index.ts`)
- มี `updateForm()` function ที่ merge partial updates และ **auto-save ลง `localStorage`** ทันที (`key = "early-retire-form"`)
- ตอน mount จะ load จาก `localStorage` ถ้ามี

### 6.2 Data Flow แต่ละขั้นตอน
```
page.tsx (state + calculations)
  ├─ ProgressBar (currentStep)
  ├─ PersonalInfoForm → updateForm({ birthDate, startDate, endDate, ... })
  ├─ ServicePeriodForm → updateForm({ multiplierPeriods, sickLeaveDays, ... })
  ├─ SalaryHistoryForm → updateForm({ position, currentSalary, assessmentIncreases, ... })
  ├─ SalaryTable.tsx → รับ records จาก useMemo (ไม่มี state ของตัวเอง)
  └─ ResultSection → รับ calculated results ผ่าน props
```

### 6.3 Calculations
- คำนวณทั้งหมดทำใน `useMemo` บน `page.tsx`:
  - `servicePeriod` → `calculateServicePeriod(start, end)`
  - `salaryRecords` → `generateSalaryTable(...)`
  - `nonGfpResult` → `calculatePensionNonGfp(lastSalary, totalServiceYears)`
  - `gfpResult` → `calculatePensionGfp(avg60Months, totalServiceYears)`
  - `livelihood` → `calculateLivelihood(monthlyPension, mode)`

---

## 7. สูตรคำนวณหลัก (จาก `lib/calculations.ts`)

### 7.1 เงินบำนาญ
- **Non-GFP:** `monthly = lastSalary * totalServiceYears / 50`, `lumpSum = lastSalary * totalServiceYears`
- **GFP:** `monthly = min(avg60Months * totalServiceYears / 50, avg60Months * 0.70)`, `lumpSum = avg60Months * totalServiceYears`

### 7.2 บำเหน็จดำรงชีพ
- `total = monthlyPension * 15`
- แบ่งจ่าย 3 ครั้ง:
  - ครั้งที่ 1: เกษียณ/ลาออก (max 200,000)
  - ครั้งที่ 2: อายุ 65 (max 200,000)
  - ครั้งที่ 3: อายุ 70 (non-gfp: ไม่มี max, gfp: max 100,000)

### 7.3 ตารางเงินเดือน (`generateSalaryTable`)
- แต่ละรอบประเมิน = 6 เดือน
- ถ้า salary ≤ baseMid ใช้ `baseBottom` เป็นฐานคำนวณเพิ่ม ถ้ามากกว่าใช้ `baseTop`
- `rawIncrease = base * (percent / 100)`
- `actualIncrease = roundUp10(rawIncrease)` (ปัดเศษขึ้นเป็นหลักสิบ)
- `newSalary` ถ้าเกิน `fullSalary` ให้ clamp ที่ `fullSalary`
- Non-GFP: คำนวณจากรอบล่าสุดไปจนถึงวันเกษียณ
- GFP: คำนวณย้อนหลัง 60 เดือน (ประมาณ 10 รอบ) จากวันเกษียณ

### 7.4 วันเกษียณ
- อายุ 60 ปี แต่ถ้าเกิดตั้งแต่ 1 ตุลาคม ให้บวกอีก 1 ปี (อายุ 61)

---

## 8. ข้อมูล Static JSON

### `data/salary-bases.json`
Array ของระดับตำแหน่ง พร้อม:
- `fullSalary`: เงินเดือนเต็มขั้น
- `baseTop`: ฐานบน
- `baseBottom`: ฐานล่าง
- `baseMid`: ค่ากลาง (ใช้ตัดสินใจเลือกฐาน)
- `conditions`: เงื่อนไขพิเศษ (เช่น "อาวุโส2", "ทรงคุณวุฒิ2")

### `data/position-map.json`
Object ที่ map ชื่อตำแหน่ง → ระดับตำแหน่งตามประเภท (`general`, `academic`, `admin`, `management`)

### `data/rules.json`
กฎเกณฑ์คำนวณ เช่น อายุเกษียณ, ช่วงทวีคูณ, สูตรบำนาญ, เงื่อนไขบำเหน็จดำรงชีพ

---

## 9. Testing

**ปัจจุบันไม่มี test framework ติดตั้ง** (ไม่มี Jest, Vitest, Playwright, Cypress, หรือ React Testing Library)

หากต้องการเพิ่ม testing ควรพิจารณา:
- **Unit tests** สำหรับ `lib/calculations.ts` และ `lib/utils.ts` (logic คำนวณเป็นจุดสำคัญที่สุด)
- **Component tests** สำหรับ `DatePickerTH` (การแปลง พ.ศ. ↔ ค.ศ.)

---

## 10. Deployment

- เป้าหมายหลักคือ **Vercel**
- `.next/` เป็น build output
- `out/` ไม่ได้ใช้ (ไม่ได้เปิด `output: 'export'`)
- `.env.local` สามารถใช้สำหรับ environment variables ถ้าจำเป็นในอนาคต
- ไม่มี API routes ปัจจุบัน (แต่ Next.js 16 รองรับได้หากต้องการเพิ่ม backend)

---

## 11. ความปลอดภัย (Security)

- **ไม่มี authentication/authorization** — เป็น public tool
- ข้อมูลผู้ใช้เก็บเฉพาะบน **localStorage** (client-side) ไม่มีการส่งข้อมูลไป server
- ไม่มี secrets หรือ API keys ในตอนนี้
- มี `.env.example` แต่ยังไม่มีตัวแปรสำคัญ
- ควรระวัง XSS จาก dynamic content แต่ปัจจุบันไม่มี user-generated HTML

---

## 12. ข้อควรระวังสำหรับ Agent

1. **ปี พ.ศ. ↔ ค.ศ.** เป็นจุดที่ผิดพลาดได้ง่าย — ใช้ helper `toBE()` / `toCE()` เท่านั้น ห้าม hardcode 543 กระจายทั่วโค้ด
2. **ตารางเงินเดือน** มี logic ซับซ้อนเรื่องการเลือกฐาน (`baseTop` vs `baseBottom`) และการปัดเศษ (`roundUp10`) อย่าแก้โดยไม่ตรวจสอบ Excel template ใน `docs/`
3. **Type duplication** — บาง type (เช่น `PensionResult`, `SalaryRecord`) มีทั้งใน `types/index.ts` และ `lib/calculations.ts` ควร sync ให้ตรงกัน
4. **Client Components ทั้งหมด** — อย่าเพิ่ม Server Component ที่พยายามใช้ browser APIs (`window`, `localStorage`, `document`) โดยตรง
5. **Tailwind CSS v4** — ใช้ `@import "tailwindcss"` และ `@theme inline` syntax ที่แตกต่างจาก v3 อย่าใช้ `tailwind.config.js` แบบเก่า
6. **Next.js 16** — ใช้ App Router เป็นหลัก ไม่มี `pages/` directory
