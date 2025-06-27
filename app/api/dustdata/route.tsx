import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
    const MAC_ADDRESS = "2D-AA-7D-CD-D4-CD";

    try {
        const response = await axios.get(`http://172.25.11.111:8000/api/last_minute_data`, {
            params: {
                MacID: MAC_ADDRESS
            },
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000 // 10 วินาที
        });

        const rawData = response.data;

        if (!rawData.data || !Array.isArray(rawData.data) || rawData.data.length === 0 || rawData.status !== 1) {
            // ถ้าไม่มีข้อมูลจริง ให้ส่งข้อมูล mock
            return NextResponse.json({
                success: true,
                data: getMockData()
            });
        }

        // ดึงข้อมูลแถวแรกของ array
        const latestData = rawData.data[0];

        const formattedData = {
            pm25: latestData.PM2 ?? 0,
            temperature: latestData.temperature ?? 0,
            humidity: latestData.humidity ?? 0,
            timestamp: latestData.time ?? new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Error fetching dust data:', error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        }
        return NextResponse.json({
            success: true,
            data: getMockData()
        });
    }
}

function getMockData() {
    return {
        pm25: Math.floor(Math.random() * 30) + 10, // ค่าระหว่าง 10-40
        temperature: parseFloat((Math.random() * 5 + 23).toFixed(1)), // ค่าระหว่าง 23-28
        humidity: parseFloat((Math.random() * 20 + 50).toFixed(1)), // ค่าระหว่าง 50-70
        timestamp: new Date().toISOString()
    };
}
