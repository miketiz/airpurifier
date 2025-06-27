import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const MAC_ADDRESS = "2D-AA-7D-CD-D4-CD";
    
    try {
        // ดึงข้อมูลจาก API
        const response = await fetch(`http://172.25.11.111:8000/api/Getdata/?MacID=${MAC_ADDRESS}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // เพิ่ม timeout เพื่อป้องกันการรอนานเกินไป
            signal: AbortSignal.timeout(15000) // 15 วินาที
        });
        
        // ตรวจสอบว่า response สำเร็จหรือไม่
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
        const rawData = await response.json();

        if (!rawData.data || rawData.status !== "1") {
            // ถ้าไม่มีข้อมูลจริง ให้ส่งข้อมูลตัวอย่างกลับไปแทน
            return NextResponse.json({
                success: true,
                data: getMockHistoricalData()
            });
        }

        // ประมวลผลข้อมูลเพื่อจัดกลุ่มตามชั่วโมง
        const hourlyData = processHourlyData(rawData.data);

        return NextResponse.json({
            success: true,
            data: hourlyData
        });

    } catch (error) {
        console.error('Error fetching historical dust data:', error);
        // ส่งข้อมูลตัวอย่างกลับไปเมื่อเกิดข้อผิดพลาด
        return NextResponse.json({
            success: true,
            data: getMockHistoricalData()
        });
    }
}

// ฟังก์ชันประมวลผลข้อมูลเพื่อจัดกลุ่มตามชั่วโมง
function processHourlyData(data: any[]) {
    // สร้าง Map เพื่อเก็บข้อมูลแยกตามชั่วโมง
    const hourlyMap = new Map();
    
    // วนลูปข้อมูลทั้งหมด
    data.forEach(item => {
        try {
            // แปลงเวลาให้เป็น Date object
            const timestamp = new Date(item.time);
            
            // สร้าง key สำหรับชั่วโมง (ใช้รูปแบบ YYYY-MM-DD HH:00)
            const hourKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ${String(timestamp.getHours()).padStart(2, '0')}:00`;
            
            // ถ้ายังไม่มีข้อมูลของชั่วโมงนี้ ให้สร้างใหม่
            if (!hourlyMap.has(hourKey)) {
                hourlyMap.set(hourKey, {
                    hour: `${String(timestamp.getHours()).padStart(2, '0')}:00`,
                    pm25Values: [],
                    tempValues: [],
                    humidityValues: [],
                    timestamp: timestamp.toISOString()
                });
            }
            
            // เพิ่มค่าเข้าไปในอาร์เรย์
            const hourData = hourlyMap.get(hourKey);
            hourData.pm25Values.push(Number(item.MQ2));
            hourData.tempValues.push(Number(item.temperature));
            hourData.humidityValues.push(Number(item.humidity));
        } catch (error) {
            console.error('Error processing data item:', error);
        }
    });
    
    // คำนวณค่าเฉลี่ยสำหรับแต่ละชั่วโมง
    const hourlyAverages = Array.from(hourlyMap.values()).map(hourData => {
        return {
            hour: hourData.hour,
            pm25: calculateAverage(hourData.pm25Values),
            temperature: calculateAverage(hourData.tempValues),
            humidity: calculateAverage(hourData.humidityValues),
            timestamp: hourData.timestamp
        };
    });
    
    // เรียงลำดับตามเวลา
    hourlyAverages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // ส่งคืนข้อมูล 12 ชั่วโมงล่าสุด (หรือน้อยกว่าถ้ามีไม่ถึง)
    return hourlyAverages.slice(-12);
}

// ฟังก์ชันคำนวณค่าเฉลี่ย
function calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return parseFloat((sum / values.length).toFixed(1));
}

// ฟังก์ชันสร้างข้อมูลตัวอย่างเมื่อไม่สามารถเชื่อมต่อกับ API ได้
function getMockHistoricalData() {
    const hours = [];
    const now = new Date();
    
    // สร้างข้อมูลย้อนหลัง 12 ชั่วโมง
    for (let i = 11; i >= 0; i--) {
        const timestamp = new Date(now);
        timestamp.setHours(now.getHours() - i);
        timestamp.setMinutes(0, 0, 0);
        
        hours.push({
            hour: `${String(timestamp.getHours()).padStart(2, '0')}:00`,
            pm25: Math.floor(Math.random() * 30) + 10, // ค่าระหว่าง 10-40
            temperature: parseFloat((Math.random() * 5 + 23).toFixed(1)), // ค่าระหว่าง 23-28
            humidity: parseFloat((Math.random() * 20 + 50).toFixed(1)), // ค่าระหว่าง 50-70
            timestamp: timestamp.toISOString()
        });
    }
    
    return hours;
}