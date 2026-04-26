/**
 * Canonical order + display labels for ระดับตำแหน่ง (civil-service position-level)
 * dropdowns. Source: improve-flow-logic.txt item #13.
 *
 * Levels not in this list are excluded from dropdown selectors. Existing data
 * with non-listed levels (e.g. "ทักษะพิเศษ") still parses via the underlying
 * salary-bases.json, but won't be selectable in the redesigned UI.
 */
export const LEVEL_DISPLAY_ORDER: Array<{ value: string; label: string }> = [
  // กลุ่มทั่วไป
  { value: "ปฏิบัติงาน", label: "ปฏิบัติงาน" },
  { value: "ชำนาญงาน", label: "ชำนาญงาน" },
  { value: "อาวุโส", label: "อาวุโส" },
  { value: "อาวุโส2", label: "อาวุโส2 (สังคีต ช่างศิลป์)" },
  // กลุ่มวิชาการ
  { value: "ปฏิบัติการ", label: "ปฏิบัติการ" },
  { value: "ชำนาญการ", label: "ชำนาญการ" },
  { value: "ชำนาญการพิเศษ", label: "ชำนาญการพิเศษ" },
  { value: "เชี่ยวชาญ", label: "เชี่ยวชาญ" },
  { value: "ทรงคุณวุฒิ", label: "ทรงคุณวุฒิ" },
  { value: "ทรงคุณวุฒิ2", label: "ทรงคุณวุฒิ (แพทย์, กฤษฎีกา)" },
  // กลุ่มอำนวยการ
  { value: "อำนวยการต้น", label: "อำนวยการต้น" },
  { value: "อำนวยการสูง", label: "อำนวยการสูง" },
  // กลุ่มบริหาร
  { value: "บริหารต้น", label: "บริหารต้น" },
  { value: "บริหารสูง", label: "บริหารสูง" },
] as const;

/** Get display label for a level value; falls back to the value itself when not in the list. */
export function getLevelLabel(value: string): string {
  return LEVEL_DISPLAY_ORDER.find((l) => l.value === value)?.label ?? value;
}
