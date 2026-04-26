"use client";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            © 2026 กองบริหารทรัพยากรบุคคล สำนักงานปลัดกระทรวงยุติธรรม
          </p>
          <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
            เว็บไซต์นี้จัดทำขึ้นเพื่อช่วยคำนวณ
            <span className="font-medium text-gray-500">ประมาณการ</span>
            บำเหน็จบำนาญเบื้องต้นเท่านั้น กรุณาตรวจสอบกับหน่วยงานที่เกี่ยวข้องก่อนตัดสินใจ
          </p>
        </div>
      </div>
    </footer>
  );
}
