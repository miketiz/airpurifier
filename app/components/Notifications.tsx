import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export default function Notifications() {
    useEffect(() => {
        const eventSource = new EventSource('/api/notifications');
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'dust_alert') {
                toast.error(`ค่าฝุ่น PM2.5 เกินกำหนด: ${data.value} µg/m³`);
            }
        };
        
        return () => {
            eventSource.close();
        };
    }, []);
    
    return null; // Component นี้ไม่มี UI
}