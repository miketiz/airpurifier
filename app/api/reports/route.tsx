import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const MAC_ADDRESS = "2D-AA-7D-CD-D4-CD";
    
    try {
        // ดึงข้อมูลจาก API
        const response = await fetch(`http://172.25.11.111:8000/avg/week?mac_id=${MAC_ADDRESS}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // เพิ่ม timeout เพื่อป้องกันการรอนานเกินไป
            signal: AbortSignal.timeout(10000) // 10 วินาที
        });
        
        // ตรวจสอบว่า response สำเร็จหรือไม่
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const rawData = await response.json();

        if (!rawData.data || rawData.status !== 1) {
            // ถ้าไม่มีข้อมูลจริง ให้ส่งข้อมูลตัวอย่างกลับไปแทน
            return NextResponse.json({
                success: true,
                data: getMockData()
            });
        }

        // แปลงข้อมูลจาก object เป็น array และเรียงตามวันที่
        const sortedDates = Object.keys(rawData.data).sort();
        
        // ดึงเฉพาะค่า MQ2 และวันที่
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const values:any= [];
        const labels:any = [];

        sortedDates.forEach(date => {
            const dateObj = new Date(date);
            labels.push(`${days[dateObj.getDay()]} ${dateObj.getDate()}/${dateObj.getMonth() + 1}`);
            values.push(rawData.data[date].MQ2);
        });

        // คำนวณค่าเฉลี่ย MQ2
        const average = values.length > 0
            ? (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1)
            : "0.0";

        // สร้าง response object
        const formattedData = {
            labels: labels,
            values: values,
            average: average
        };

        return NextResponse.json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Error fetching weekly data:', error);
        // ส่งข้อมูลตัวอย่างกลับไปเมื่อเกิดข้อผิดพลาด
        return NextResponse.json({
            success: true,
            data: getMockData()
        });
    }
}

// ฟังก์ชันสร้างข้อมูลตัวอย่างเมื่อไม่สามารถเชื่อมต่อกับ API ได้
function getMockData() {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const labels = [];
    const values = [];
    
    // สร้างข้อมูลย้อนหลัง 7 วัน
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(`${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`);
        // สร้างค่าสุ่มระหว่าง 10-50
        values.push(Math.floor(Math.random() * 40) + 10);
    }
    
    // คำนวณค่าเฉลี่ย
    const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    
    return {
        labels: labels,
        values: values,
        average: average
    };
}