import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-sans-thai",
  subsets: ["thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "คำนวณบำเหน็จบำนาญ - กองบริหารทรัพยากรบุคคล",
  description:
    "เครื่องมือคำนวณบำเหน็จบำนาญสำหรับข้าราชการ สำนักงานปลัดกระทรวงยุติธรรม คำนวณประมาณการบำเหน็จบำนาญกรณีเกษียณอายุและกรณีอื่นๆ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${notoSansThai.variable} h-full antialiased`}
    >
      <body className={`min-h-full flex flex-col bg-background text-foreground ${notoSansThai.className}`}>
        {children}
      </body>
    </html>
  );
}
