# PRD Plan: Early Retire - เว็บแอพคำนวณบำเหน็จบำนาญ

> สรุปจาก `init-prd.txt` + ข้อเสนอแนะ + คำถามที่ต้องการความชัดเจน

---

## 1. สรุปความต้องการหลัก (Core Requirements)

เว็บแอพคำนวณบำเหน็จบำนาญข้าราชการ 2 กรณี:
- **กรณี A:** ไม่เป็นสมาชิก กบข. (ใช้เงินเดือนเดือนสุดท้าย)
- **กรณี B:** เป็นสมาชิก กบข. (ใช้เงินเฉลี่ย 60 เดือนสุดท้าย)

### Stack ที่เลือก
| เทคโนโลยี | หมายเหตุ |
|---|---|
| Next.js 16+ | App Router, Server/Client Components |
| Tailwind CSS 4 | Styling |
| Lucide Icons | SVG Icons |
| Noto Sans Thai | Font ภาษาไทย |
| Framer Motion | Animation |
| JSON Data | ฐานเงินเดือน + กฎเกณฑ์ |
| Vercel | Deploy ผ่าน GitHub |

---

## 2. โครงสร้างข้อมูลที่ต้องสร้าง (Data Layer)

### 2.1 แปลงจาก Sheet `ฐานคำนวณ` → `src/data/salary-bases.json`
```json
[
  {
    "level": "ปฏิบัติงาน",
    "category": "general",
    "fullSalary": 38750,
    "baseTop": 18110,
    "baseBottom": 12310,
    "baseMid": 15210,
    "conditions": null
  },
  {
    "level": "อาวุโส",
    "category": "general",
    "fullSalary": 69040,
    "baseTop": 35070,
    "baseTopAlt": 44970,
    "baseBottom": 32250,
    "baseMid": 32250,
    "baseMidAlt": 35120,
    "conditions": "อาวุโส2 ใช้เมื่อเงินเดือนยังไม่ถึงขั้นสูงของฐานบน 1 (41,620)"
  }
]
```

### 2.2 แผนที่ตำแหน่งงาน → `src/data/position-map.json`
```json
{
  "เจ้าพนักงานธุรการ": {
    "general": "ปฏิบัติงาน",
    "academic": "ปฏิบัติการ",
    "admin": "อำนวยการต้น",
    "management": "บริหารต้น"
  }
}
```

### 2.3 กฎเกณฑ์คำนวณ → `src/data/rules.json`
```json
{
  "retirementAge": 60,
  "retirementAgeBonus": {
    "condition": "เกิดตั้งแต่ 1 ตุลาคม",
    "bonusYears": 1
  },
  "minimumServiceYears": 25,
  "multiplierPeriods": [
    { "start": "1976-10-07", "end": "1977-01-05", "label": "ปี 19" },
    { "start": "1991-02-23", "end": "1991-05-02", "label": "ปี 34" }
  ],
  "pension": {
    "nonGfp": {
      "formula": "lastSalary * totalServiceYears",
      "monthlyFormula": "lastSalary * totalServiceYears / 50",
      "livelihoodFormula": "monthlyPension * 15",
      "livelihoodPayments": [
        { "age": 60, "max": 200000 },
        { "age": 65, "max": 200000 },
        { "age": 70, "max": null }
      ]
    },
    "gfp": {
      "formula": "lastSalary * totalServiceYears",
      "monthlyFormula": "avg60Months * totalServiceYears / 50",
      "monthlyFormulaAlt": "avg60Months * 0.70",
      "takeLower": true,
      "livelihoodFormula": "monthlyPension * 15",
      "livelihoodPayments": [
        { "age": 60, "max": 200000 },
        { "age": 65, "max": 200000 },
        { "age": 70, "max": 100000 }
      ]
    }
  }
}
```

---

## 3. สถาปัตยกรรมแอพ (Proposed Architecture)

```
app/
├── page.tsx                    # Landing + Form
├── layout.tsx                  # Root layout + Font + Metadata
├── globals.css                 # Tailwind + Custom styles
├── sections/
│   ├── HeroSection.tsx         # Intro + CTA
│   ├── PersonalInfoForm.tsx    # ข้อมูลส่วนตัว (datepicker)
│   ├── ServicePeriodForm.tsx   # เวลาราชการ + ทวีคูณ
│   ├── SalaryHistoryForm.tsx   # % เลื่อนเงินเดือนย้อนหลาย
│   ├── SalaryTable.tsx         # ตารางคำนวณเงินเดือน
│   └── ResultSection.tsx       # ผลบำเหน็จบำนาญ 2 กรณี
├── components/
│   ├── ui/                     # Reusable UI (Button, Input, Card)
│   ├── DatePickerTH.tsx        # Date picker พ.ศ.
│   ├── DynamicFieldList.tsx    # เพิ่ม/ลบช่องกรอกทวีคูณ
│   └── AnimatedNumber.tsx      # ตัวเลขขึ้นแบบ animate
├── hooks/
│   ├── useRetirementCalc.ts    # Logic คำนวณหลัก
│   ├── useSalaryTable.ts       # Logic ตารางเงินเดือน
│   └── useLocalStorage.ts      # บันทึกข้อมูลกรอก
├── lib/
│   ├── utils.ts                # Helpers (พ.ศ. ↔ ค.ศ., date diff)
│   └── calculations.ts         # สูตรคณิตศาสตร์บำนาญ
└── data/
    ├── salary-bases.json
    ├── position-map.json
    └── rules.json
```

---

## 4. Flow การใช้งาน (User Journey)

```
[1] หน้าแรก (Hero)
    └── เลือกกรณี: ไม่เป็น กบข. | เป็น กบข.

[2] ขั้นตอนที่ 1: ข้อมูลส่วนตัว
    ├── วันเดือนปีเกิด (พ.ศ.)
    ├── วันบรรจุ (พ.ศ.)
    └── วันพ้นส่วนราชการ (พ.ศ.)
        ├── เกษียณอายุ 60 (คำนวณอัตโนมัติ +1 ปี หากเกิดตั้งแต่ 1 ต.ค.)
        ├── อายุราชการ 25 ปี (คำนวณจากวันบรรจุ)
        └── กำหนดเอง

[3] ขั้นตอนที่ 2: เวลาราชการทวีคูณ
    ├── ช่วงที่ 1: 7 ต.ค. 2519 - 5 ม.ค. 2520 (default)
    ├── ช่วงที่ 2: 23 ก.พ. 2534 - 2 พ.ค. 2534 (default)
    ├── ช่วงกำหนดเอง 1-3 (เพิ่มได้ไม่จำกัด)
    └── หัก: ลาป่วย, ลากิจ, ลาพักผ่อน

[4] ขั้นตอนที่ 3: ตำแหน่งและเงินเดือน
    ├── เลือกตำแหน่งงาน → auto-fill ระดับตำแหน่ง
    ├── เงินเดือนปัจจุบัน
    └── รอบการประเมินล่าสุด

[5] ขั้นตอนที่ 4: ประวัติเลื่อนเงินเดือน
    ├── แสดง 6 รอบการประเมินย้อนหลัง (auto-generate จากรอบล่าสุด)
    ├── ผู้ใช้แก้ไข % ที่เลื่อนได้
    └── คำนวณค่าเฉลี่ย % (ทศนิยม 1 ตำแหน่ง)

[6] ขั้นตอนที่ 5: ตารางคำนวณเงินเดือน
    ├── ถ้า non-GFP: แสดงรอบล่าสุด → ถึงวันเกษียณ
    ├── ถ้า GFP: แสดง 60 เดือนสุดท้าย (นับรอบประเมิน)
    ├── คอลัมน์: รอบ | ระดับ | เงินเดือนเดิม | ขั้นสูง | ฐาน | %เลื่อน | เงินที่เลื่อน | เงินเดือนใหม่
    └── ถ้ารอบยังไม่ถึง: แจ้งเตือนให้ใช้ % เฉลี่ย

[7] ผลลัพธ์ (Result)
    ├── สรุปข้อมูลส่วนตัว
    ├── ตารางเงินเดือนสรุป
    ├── เงินบำเหน็จ (ก้อน)
    ├── เงินบำนาญรายเดือน
    └── บำเหน็จดำรงชีพ (แบ่ง 3 ครั้ง)
```

---

## 5. คำถามที่ต้องการความชัดเจน (Gaps & Questions)

### 🔴 สำคัญมาก (Blockers)

**Q1: สูตรคำนวณ "เงินที่เลื่อนจริง" คืออะไร?**
- จาก Excel ดูเหมือน: `เงินที่เลื่อน = ฐาน × % เลื่อน` แล้วปัดเศษ? (เช่น 1450.8 → 1460)
- กฎการปัดเศษคืออะไร? (ขึ้นเป็น 10? ขึ้นเป็น 100?)

**Q2: การเลื่อนขั้นตำแหน่งอัตโนมัติ มีกฎอย่างไร?**
- ใน `retire-gfp` มีการเปลี่ยนจาก ชำนาญการพิเศษ → อำนวยการต้น → อำนวยการสูง
- เงื่อนไขการเลื่อนขั้นคืออะไร? (อายุราชการ? ปีงบประมาณ?)
- หรือผู้ใช้ต้องกำหนดเอง?

**Q3: เงื่อนไข "ฐาน" ในการคำนวณเลื่อนเงินเดือน มีกี่กรณี?**
- ดูจาก Excel มีฐานบน/ล่าง/กลาง ใช้อันไหนเมื่อไหร่?
- เงื่อนไขพิเศษของ "อาวุโส2" และ "ทรงคุณวุฒิ2" ต้องมี logic ตรวจสอบอย่างไร?

### 🟡 ควรตัดสินใจก่อนเริ่ม (High Priority)

**Q4: UI/UX มี Reference หรือ Wireframe ไหม?**
- ต้องการหน้าจอแบบ Step Wizard (หลายขั้นตอน) หรือ Single Page (กรอกทั้งหมดในหน้าเดียว)?
- ต้องการเปรียบเทียบ 2 กรณี side-by-side หรือแยกหน้า?

**Q5: ต้องการบันทึก/แชร์ผลลัพธ์หรือไม่?**
- บันทึก history ใน localStorage?
- Export PDF/Print?
- Share link ที่มี pre-filled data?

**Q6: Animation & Effect ระดับไหน?**
- Framer Motion ใช้แค่ fade/transition ระหว่างขั้นตอน?
- หรือต้องการ animation ซับซ้อน (เช่น ตัวเลขวิ่ง, confetti เมื่อคำนวณเสร็จ)?

**Q7: Responsive Design รองรับอะไรบ้าง?**
- Mobile-first? หรือ Desktop เป็นหลัก?
- ตารางเงินเดือนบนมือถือแสดงอย่างไร? (scroll horizontal / stack cards?)

### 🟢 เสริมความสมบูรณ์ (Nice to Have)

**Q8: Dark Mode ต้องการไหม?**

**Q9: ต้องการระบบ Admin หรือ Backend ไหม?**
- ปัจจุบันเป็น Static Site (JSON local) แต่ถ้าอนาคตต้องการอัพเดทฐานเงินเดือนผ่าน API?

**Q10: การ validate ข้อมูล**
- ถ้าวันที่ไม่สมเหตุสมผล (เช่น วันเกษียณก่อนวันบรรจุ) จะแจ้งเตือนอย่างไร?
- ต้องการ Tooltip/Help text อธิบายแต่ละฟิลด์ไหม?

---

## 6. ข้อเสนอแนะจากการวิเคราะห์ (Recommendations)

### 6.1 แนะนำให้ทำ (Should Have)
1. **แยกเป็น Step Wizard** (5 ขั้นตอน) พร้อม Progress Bar → ผู้ใช้ไม่ overwhelmed
2. **Auto-save ทุกขั้นตอน** ลง localStorage → กรอกค้างไว้แล้วกลับมาต่อได้
3. **Preview ตารางเงินเดือนแบบ Real-time** → แก้ % เลื่อนแล้วเห็นผลทันที
4. **เปรียบเทียบ 2 กรณีในหน้าสรุป** → ช่วยให้ตัดสินใจได้ว่าเป็น กบข. หรือไม่ดีกว่า

### 6.2 ควรระวัง (Watch Out)
1. **ปี พ.ศ. ↔ ค.ศ.** เป็นจุดที่ผิดบ่อย → ต้องมี utility แปลงที่ robust
2. **ตารางเงินเดือนอาจมีรอบประเมินมาก** (กรณี GFP 60 เดือน = ~10 รอบ) → ต้อง optimize rendering
3. **การคำนวณวันที่ไทย** (ปีอธิกสุรทิน, จำนวนวันในเดือน) → ใช้ `date-fns` หรือ native Date ที่ระวัง timezone

### 6.3 สเกลงานที่ประมาณการ
| Phase | งาน | ประมาณเวลา |
|---|---|---|
| Phase 1 | Setup project + แปลง JSON + โครงสร้าง data | 1 วัน |
| Phase 2 | Form ขั้นตอน 1-2 (ข้อมูลส่วนตัว + เวลาราชการ) | 1-2 วัน |
| Phase 3 | Form ขั้นตอน 3-4 (ตำแหน่ง + ประวัติเลื่อนเงินเดือน) | 1-2 วัน |
| Phase 4 | ตารางคำนวณ + Logic เงินเดือน | 2-3 วัน |
| Phase 5 | หน้าผลลัพธ์ + Animation | 1-2 วัน |
| Phase 6 | Polish UX/UI + Responsive + Testing | 1-2 วัน |
| **รวม** | | **~7-12 วัน** |

---

## 7. Next Steps

หากคุณตอบคำถามข้างต้น (โดยเฉพาะ Q1-Q3 เรื่องสูตรคำนวณ) ผมสามารถ:
1. ✅ สร้าง Repository + Setup Next.js 16 + Tailwind 4 +  dependencies ทั้งหมด
2. ✅ แปลง `template คำนวณบำนาญ.xlsx` → JSON files
3. ✅ สร้าง Components + Hooks + Calculation engine
4. ✅ Deploy ขึ้น Vercel

**คุณอยากให้เริ่มจากส่วนไหนก่อน? หรือต้องการให้ผมตอบ/ปรับแผนตรงไหนเพิ่มเติมไหมครับ?**
