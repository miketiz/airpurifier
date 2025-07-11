// components/LoadingSpinner.tsx
"use client";

import { useEffect, useState } from "react";
import { Leaf, AlertCircle } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import "@/styles/LoadingSpinner.css";

interface LoadingSpinnerProps {
  message?: string;
  showTips?: boolean;
}

export default function LoadingSpinner({
  message = "กำลังโหลดข้อมูล",
  showTips = true,
}: LoadingSpinnerProps) {
  const { darkMode } = useTheme();
  const [currentTip, setCurrentTip] = useState(0);
  
  const tips = [
    "เครื่องฟอกอากาศควรตั้งในบริเวณที่มีการไหลเวียนอากาศดี เพื่อประสิทธิภาพสูงสุด",
    "ควรทำความสะอาดตัวกรองอากาศเป็นประจำทุก 2-3 เดือน หรือเมื่อเห็นว่าสกปรก",
    "ฝุ่นขนาดเล็ก PM 2.5 อาจก่อให้เกิดปัญหาสุขภาพในระยะยาว โดยเฉพาะโรคระบบทางเดินหายใจ",
    "โหมดอัตโนมัติจะช่วยปรับความแรงพัดลมให้เหมาะกับคุณภาพอากาศในขณะนั้น",
    "ควรปิดประตูและหน้าต่างเมื่อใช้งานเครื่องฟอกอากาศเพื่อประสิทธิภาพสูงสุด"
  ];

  useEffect(() => {
    // สลับคำแนะนำทุก 4 วินาที
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className={`loading-container ${darkMode ? 'dark' : ''}`}>
      <div className="loading-spinner-wrapper">
        <div className="loading-spinner"></div>
        <Leaf className="spinner-icon" />
      </div>

      <div className="loading-message">
        {message}
      </div>
      
      <div className="loading-progress-container">
        <div className="loading-progress"></div>
      </div>
      
      {showTips && (
        <div className="loading-tips-container">
          <div className="loading-tip" key={currentTip}>
            <AlertCircle className="tip-icon" size={20} />
            <span>{tips[currentTip]}</span>
          </div>
        </div>
      )}
    </div>
  );
}