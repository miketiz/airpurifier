import { NextResponse } from "next/server";
import axios, { type AxiosError } from "axios";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, email, password } = body;

        if (!username || !email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: "กรุณากรอกข้อมูลให้ครบถ้วน",
                },
                { status: 400 }
            );
        }

        try {
            const response = await axios.post("http://172.25.11.111:8000/auth/register", {
                username,
                email,
                password,
            });

            return NextResponse.json({
                success: true,
                message: "ลงทะเบียนสำเร็จ",
                data: response.data,
            });
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ detail?: string }>;
            if (
                axiosError.response &&
                axiosError.response.data?.detail === "Username or email already exists"
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว",
                    },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                {
                    success: false,
                    message:
                        axiosError.response?.data?.detail || "ไม่สามารถลงทะเบียนได้",
                },
                { status: axiosError.response?.status || 500 }
            );
        }
    } catch (error) {
        console.error("Error during registration:", error);
        return NextResponse.json(
            {
                success: false,
                message: "เกิดข้อผิดพลาดภายในระบบ",
            },
            { status: 500 }
        );
    }
}
