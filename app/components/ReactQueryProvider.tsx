"use client";

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// สร้าง QueryClient ในฟังก์ชันเพื่อรองรับ SSR และ หลีกเลี่ยงการแชร์ state ระหว่าง users
export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,   // ไม่ fetch ใหม่เมื่อ focus กลับมาที่หน้าต่าง
        staleTime: 1000 * 60 * 5,      // ข้อมูลจะถือว่าเก่าหลังจาก 5 นาที
        gcTime: 1000 * 60 * 30,        // เก็บข้อมูลใน cache 30 นาที
        retry: 1,                      // ลองใหม่ 1 ครั้งหากเกิดความล้มเหลว
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}