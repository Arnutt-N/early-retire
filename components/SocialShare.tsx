"use client";

import { useState } from "react";
import { Share2, Link, Check } from "lucide-react";
import Button from "./ui/Button";

interface SocialShareProps {
  url?: string;
  title?: string;
}

export default function SocialShare({
  url = typeof window !== "undefined" ? window.location.href : "",
  title = "คำนวณบำเหน็จบำนาญ - กองบริหารทรัพยากรบุคคล สำนักงานปลัดกระทรวงยุติธรรม",
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    line: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-[var(--text-muted)] flex items-center gap-2">
        <Share2 size={16} />
        แชร์ผลลัพธ์
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <a
          href={shareUrls.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1877F2] text-white text-sm font-medium hover:bg-[#166fe5] transition-colors"
        >
          Facebook
        </a>
        <a
          href={shareUrls.line}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#06C755] text-white text-sm font-medium hover:bg-[#05b34d] transition-colors"
        >
          Line
        </a>
        <a
          href={shareUrls.x}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          X
        </a>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          icon={copied ? <Check size={16} /> : <Link size={16} />}
        >
          {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
        </Button>
      </div>
    </div>
  );
}
