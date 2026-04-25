export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          © {new Date().getFullYear() + 543} กองบริหารทรัพยากรบุคคล สำนักงานปลัดกระทรวงยุติธรรม
        </p>
        <p className="text-xs text-gray-400 mt-1">
          เว็บไซต์นี้จัดทำขึ้นเพื่อช่วยคำนวณประมาณการบำเหน็จบำนาญเบื้องต้น ไม่ใช่ค่าคำนวณที่ถูกต้องตามกฎหมายแต่อย่างใด
        </p>
      </div>
    </footer>
  );
}
