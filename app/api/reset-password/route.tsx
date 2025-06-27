import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');

        if (!token) {
            return NextResponse.json({
                message: "กรุณาระบุ token",
                success: false
            }, { status: 400 });
        }

        console.log('Sending token to API:', token);

        // เรียก API เพื่อตรวจสอบ token - ส่ง token เป็น query parameter
        const apiUrl = `http://172.25.11.111:8000/user/check_token_resetpassword?token=${encodeURIComponent(token)}`;
        console.log('Calling API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'POST'
        });

        const data = await response.json();
        console.log('Token check response data:', data);

        // ตรวจสอบ response ตามรูปแบบที่ API ส่งกลับมา
        if (data.status === 1 && data.data && data.data.email) {
            return NextResponse.json({
                success: true,
                email: data.data.email,
                username: data.data.username,
                message: "ตรวจสอบ token สำเร็จ"
            });
        }

        // กรณี token ไม่ถูกต้อง
        return NextResponse.json({
            success: false,
            message: data.message === "failed_not_found" ? "Token ไม่ถูกต้องหรือหมดอายุ" : 
                     data.message === "user_not_found" ? "ไม่พบข้อมูลผู้ใช้" :
                     "เกิดข้อผิดพลาดในการตรวจสอบ Token"
        }, { status: 400 });

    } catch (error) {
        console.error('Error checking token:', error);
        return NextResponse.json({
            success: false,
            message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์"
        }, { status: 500 });
    }
}

// เพิ่ม POST handler สำหรับการรีเซ็ตรหัสผ่าน
export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({
                success: false,
                message: "กรุณาระบุข้อมูลให้ครบถ้วน"
            }, { status: 400 });
        }

        // เรียก API เพื่อรีเซ็ตรหัสผ่าน
        const response = await fetch('http://172.25.11.111:8000/user/reset_password_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: req.headers.get('x-user-email') || "",
                token: token,
                new_password: password
            })
        });

        const data = await response.json();
        console.log('Reset password response:', data);

        if (data.status === 1) {
            return NextResponse.json({
                success: true,
                message: "เปลี่ยนรหัสผ่านสำเร็จ"
            });
        }

        return NextResponse.json({
            success: false,
            message: data.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้"
        }, { status: 400 });

    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json({
            success: false,
            message: "เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์"
        }, { status: 500 });
    }
}
