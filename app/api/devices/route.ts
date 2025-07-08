import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route"; // ปรับ path ให้ถูกต้อง

// GET: ดึง device ตาม user_id
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get("user_id");
        if (!user_id) {
            return NextResponse.json({ success: false, message: "Missing user_id" }, { status: 400 });
        }
        const res = await axios.get(`http://172.25.11.111:8000/devices/get_device?user_id=${user_id}`);
        const data = res.data;
        console.log("API /devices/get_device response:", data);
        return NextResponse.json({ success: true, data: data.data }); // ส่ง data.data กลับ
    } catch (err) {
        return NextResponse.json({ success: false, message: "API error" }, { status: 500 });
    }
}

// PATCH: อัปเดตชื่อหรือที่ตั้ง device
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    console.log("API session", session);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { connection_key, device_name, location } = body;
    if (!connection_key) {
        return NextResponse.json({ success: false, message: "Missing connection_key" }, { status: 400 });
    }
    const user_id = session.user.id;
    console.log("PATCH payload", { user_id, connection_key, device_name, location }); // เพิ่ม log ตรงนี้
    try {
        const res = await axios.patch("http://172.25.11.111:8000/devices/update_device", {
            user_id,
            connection_key,
            device_name,
            location
        });
        return NextResponse.json({ success: true, data: res.data });
    } catch (err) {
        console.error("API error", err); // เพิ่ม log error
        return NextResponse.json({ success: false, message: "API error" }, { status: 500 });
    }
}