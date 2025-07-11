'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// เพิ่ม constant สำหรับ key ที่ใช้ใน localStorage
const STORAGE_KEYS = {
  DARK_MODE: 'theme_darkMode',
  USER_PREFERENCE: 'theme_userPreference',
  SYSTEM_PREFERENCE: 'theme_systemPreference'
} as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const noThemePages = ["/login", "/forgot-password"];
  const isNoThemePage = noThemePages.includes(pathname);

  // ตรวจสอบ system preference เมื่อ component mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        // ตรวจสอบการตั้งค่าที่ผู้ใช้กำหนดเอง
        const userPreference = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCE);
        
        if (userPreference !== null) {
          setDarkMode(JSON.parse(userPreference));
        } else {
          // ถ้าไม่มีการตั้งค่าจากผู้ใช้ ใช้ system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setDarkMode(prefersDark);
          // บันทึกค่า system preference
          localStorage.setItem(STORAGE_KEYS.SYSTEM_PREFERENCE, JSON.stringify(prefersDark));
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        // กรณีเกิด error ใช้ค่าเริ่มต้น
        setDarkMode(false);
      }
    }
  }, []);

  // อัพเดท class เมื่อ darkMode เปลี่ยน
  useEffect(() => {
    if (!mounted) return;

    try {
      // ไม่เพิ่ม dark class ถ้าเป็นหน้า login หรือ register
      if (!isNoThemePage) {
        if (darkMode) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
      } else {
        // ถ้าเป็นหน้า login หรือ register ให้ลบ class ทั้งหมดออก
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.remove('light');
      }

      // บันทึกค่าทั้งสองที่
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(darkMode));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [darkMode, mounted, pathname, isNoThemePage]);

  const toggleDarkMode = () => {
    try {
      // บันทึกการตั้งค่าของผู้ใช้
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCE, JSON.stringify(!darkMode));
      setDarkMode(prev => !prev);
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}