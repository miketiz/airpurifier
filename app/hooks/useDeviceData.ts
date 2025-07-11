"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ฟังก์ชันสำหรับดึงข้อมูล Device ตาม user_id
const fetchDevices = async (userId: string | undefined) => {
  if (!userId) return { success: false, data: [] };
  const response = await axios.get(`/api/devices?user_id=${userId}`);
  return response.data;
};

// ฟังก์ชันสำหรับอัปเดต Device
const updateDevice = async ({ connection_key, device_name, location }: {
  connection_key: string;
  device_name?: string;
  location?: string;
}) => {
  const response = await axios.patch('/api/devices', {
    connection_key,
    device_name,
    location
  });
  return response.data;
};

// Hook สำหรับดึงข้อมูล Devices
export function useDevices(userId: string | undefined) {
  return useQuery({
    queryKey: ['devices', userId],
    queryFn: () => fetchDevices(userId),
    enabled: !!userId,
  });
}

// Hook สำหรับอัปเดต Device
export function useUpdateDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

// Hook สำหรับลบ Device
export function useDeleteDevice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (connection_key: string) => {
      const response = await axios.delete("/api/delete-device", {
        data: { connection_key },
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}