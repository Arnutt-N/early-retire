"use client";

import { Shield, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear() + 543;

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                กองบริหารทรัพยากรบุคคล
              </p>
              <p className="text-xs text-gray-500">
                สำนักงานปลัดกระทรวงยุติธรรม
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>สร้างด้วย</span>
            <Heart size={12} className="text-red-400 fill-red-400" />
            <span>เพื่อข้าราชการไทย</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6" />

        {/* Copyright & Disclaimer */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            © {currentYear} กองบริหารทรัพยากรบุคคล สำนักงานปลัดกระทรวงยุติธรรม
          </p>
          <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
            เว็บไซต์นี้จัดทำขึ้นเพื่อช่วยคำนวณ<span className="font-medium text-gray-500">ประมาณการ</span>บำเหน็จบำนาญเบื้องต้นเท่านั้น 
            ไม่ใช่ค่าคำนวณที่ถูกต้องตามกฎหมาย กรุณาตรวจสอบกับหน่วยงานที่เกี่ยวข้องก่อนตัดสินใจ
          </p>
        </div>
      </div>
    </footer>
  );
}
