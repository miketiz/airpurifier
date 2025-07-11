"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// ฟังก์ชันดึงข้อมูลฝุ่นปัจจุบัน
const fetchCurrentDustData = async () => {
  const response = await axios.get('/api/dustdata');
  return response.data;
};

// ฟังก์ชันดึงข้อมูลฝุ่นย้อนหลัง
const fetchHistoricalDustData = async () => {
  const response = await axios.get('/api/dusthistory');
  return response.data;
};

// Hook สำหรับข้อมูลฝุ่นปัจจุบัน
export function useCurrentDustData() {
  return useQuery({
    queryKey: ['currentDust'],
    queryFn: fetchCurrentDustData,
    refetchInterval: 5 * 60 * 1000, // refresh ทุก 5 นาที
  });
}

// Hook สำหรับข้อมูลฝุ่นย้อนหลัง
export function useHistoricalDustData() {
  return useQuery({
    queryKey: ['historicalDust'],
    queryFn: fetchHistoricalDustData,
    refetchInterval: 60 * 60 * 1000, // refresh ทุก 1 ชั่วโมง
  });
}