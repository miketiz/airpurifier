import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { user_id } = await req.json();
        if (!user_id) {
            return NextResponse.json({ success: false, message: "Missing user_id" }, { status: 400 });
        }

        // แปลง user_id เป็น string เสมอ
        const userIdStr = String(user_id);

        // เรียก API จริง
        const res = await axios.post("http://172.25.11.111:8000/devices/genpin", { user_id: userIdStr })
        const data = await res.data

        // log ข้อมูลที่ตอบกลับมาจาก API
        console.log("API /devices/genpin response:", data);

        // ส่ง pin_key กลับไปที่ client
        return NextResponse.json({ success: true, pin_key: data.pin_key });
    } catch (error) {
        return NextResponse.json({ success: false, message: "API error" }, { status: 500 });
    }
}