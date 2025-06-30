import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

// GET: ดึง device ตาม user_id
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get("user_id");
        if (!user_id) {
            return NextResponse.json({ success: false, message: "Missing user_id" }, { status: 400 });
        }

        // เรียก API จริง
        const res = await axios.get(`http://172.25.11.111:8000/devices/get_device?user_id=${user_id}`);
        const data = res.data;

        // log ข้อมูลที่ตอบกลับมาจาก API
        console.log("API /devices/get_device response:", data);

        // ส่งข้อมูล device กลับไปที่ client
        return NextResponse.json({ success: true, device: data });
    } catch {
        return NextResponse.json({ success: false, message: "API error" }, { status: 500 });
    }
}

// POST: อัปเดตชื่อหรือที่ตั้ง device
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, connection_key, device_name, location } = body;
        if (!user_id || !connection_key) {
            return NextResponse.json({ success: false, message: "Missing user_id or connection_key" }, { status: 400 });
        }
        const res = await axios.post("http://172.25.11.111:8000/devices/update_device", {
            user_id,
            connection_key,
            device_name,
            location
        });
        return NextResponse.json({ success: true, data: res.data });
    } catch {
        return NextResponse.json({ success: false, message: "API error" }, { status: 500 });
    }
}