import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";

// ฟังก์ชันสำหรับตรวจสอบอีเมลผ่าน API
async function checkEmail(email: string) {
    try {
        const encodedEmail = encodeURIComponent(email);
        const response = await fetch(`http://172.25.11.111:8000/user/check_email?email=${encodedEmail}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();
        // เมื่อ status เป็น 0 แสดงว่ามีอีเมลในระบบ
        return data.status === 0;
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการตรวจสอบอีเมล:', error);
        throw error;
    }
}

// ฟังก์ชันสำหรับบันทึกโทเคนผ่าน API
async function saveResetToken(email: string, token: string) {
    try {
        const response = await fetch('http://172.25.11.111:8000/user/request_token_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                token
            })
        });

        if (!response.ok) {
            throw new Error('ไม่สามารถบันทึกโทเคนได้');
        }

        return await response.json();
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกโทเคน:', error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: "กรุณาระบุอีเมล" }, { status: 400 });
        }

        // เพิ่มการตรวจสอบรูปแบบอีเมล
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ message: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
        }

        // ตรวจสอบว่าอีเมลมีอยู่ในระบบหรือไม่
        const isEmailValid = await checkEmail(email);
        if (!isEmailValid) {
            return NextResponse.json({ message: "ไม่พบอีเมลนี้ในระบบ" }, { status: 404 });
        }

        // สร้างโทเคนแบบสุ่ม
        const resetToken = crypto.randomBytes(32).toString("hex");

        // บันทึกโทเคนผ่าน API
        await saveResetToken(email, resetToken);

        // สร้างลิงก์รีเซ็ตรหัสผ่าน
        const resetLink = `http://172.25.11.56:3000/forgotpassword?token=${resetToken}`;

        // ตั้งค่า Nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // ตั้งค่าเนื้อหาอีเมล
        const mailOptions = {
            from: `"MM-AIR" <purifiermmair@gmail.com>`,
            to: email,
            subject: "รีเซ็ตรหัสผ่านของคุณ",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2c3e50; text-align: center;">รีเซ็ตรหัสผ่าน MM-AIR</h1>
                    <p style="color: #34495e; font-size: 16px; line-height: 1.5;">เรียนผู้ใช้งานที่เคารพ,</p>
                    <p style="color: #34495e; font-size: 16px; line-height: 1.5;">
                        เราได้รับคำขอรีเซ็ตรหัสผ่านของคุณ กรุณาคลิกที่ปุ่มด้านล่างเพื่อดำเนินการต่อ:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background-color:rgb(62, 143, 197); 
                                  color: white; 
                                  padding: 12px 24px; 
                                  text-decoration: none; 
                                  border-radius: 5px;
                                  display: inline-block;">
                            รีเซ็ตรหัสผ่าน
                        </a>
                    </div>
                    <p style="color: #34495e; font-size: 14px;">
                        หมายเหตุ: ลิงก์นี้จะหมดอายุใน 10 นาที เพื่อความปลอดภัยของบัญชีของคุณ
                    </p>
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #7f8c8d; font-size: 14px;">
                            หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาละเว้นอีเมลนี้
                            <br>
                            หากมีคำถามหรือต้องการความช่วยเหลือ กรุณาติดต่อเราได้ที่: purifiermmair@gmail.com
                        </p>
                    </div>
                </div>
            `,
        };

        // ส่งอีเมล
        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: "ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว" }, { status: 200 });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน:", error);
        return NextResponse.json({ message: "ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้" }, { status: 500 });
    }
}