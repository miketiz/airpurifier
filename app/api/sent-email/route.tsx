import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ 
                success: false,
                message: 'กรุณาระบุอีเมล' 
            }, { status: 400 });
        }

        // เพิ่มการตรวจสอบรูปแบบอีเมล
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ 
                success: false,
                message: 'รูปแบบอีเมลไม่ถูกต้อง' 
            }, { status: 400 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            ...(process.env.NODE_ENV === 'development' && {
                logger: true,
                debug: true,
            }),
        });

        const mailOptions = {
            from: `"MM-AIR" <purifiermmair@gmail.com>`,
            to: email,
            subject: "ยินดีต้อนรับสู่ MM-AIR",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2c3e50; margin: 0;">ยินดีต้อนรับสู่ MM-AIR</h1>
                        <p style="color: #7f8c8d; font-size: 16px;">ขอบคุณที่เลือกใช้บริการของเรา</p>
                    </div>

                    <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        <p style="color: #34495e; font-size: 16px; line-height: 1.5; margin-top: 0;">เรียนผู้ใช้งานที่เคารพ,</p>
                        
                        <p style="color: #34495e; font-size: 16px; line-height: 1.5;">
                            ขอบคุณที่ลงทะเบียนใช้งาน MM-AIR เรารู้สึกยินดีเป็นอย่างยิ่งที่คุณเลือกใช้บริการของเรา
                        </p>

                        <p style="color: #34495e; font-size: 16px; line-height: 1.5;">
                            คุณสามารถเข้าสู่ระบบได้ทันทีด้วยอีเมลและรหัสผ่านที่คุณลงทะเบียนไว้
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="http://172.25.11.32:3000/login" 
                               style="background-color: #3498db; 
                                      color: white; 
                                      padding: 12px 24px; 
                                      text-decoration: none; 
                                      border-radius: 5px;
                                      display: inline-block;">
                                เข้าสู่ระบบ
                            </a>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #7f8c8d; font-size: 14px; margin: 0;">
                            หากคุณมีคำถามหรือต้องการความช่วยเหลือ
                        </p>
                        <p style="color: #7f8c8d; font-size: 14px; margin: 5px 0;">
                            กรุณาติดต่อเราได้ที่อีเมล: purifiermmair@gmail.com
                        </p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('ส่งอีเมลสำเร็จ: %s', info.messageId);

        return NextResponse.json({ 
            success: true,
            message: 'ส่งอีเมลต้อนรับเรียบร้อยแล้ว',
            messageId: info.messageId 
        }, { status: 200 });
    } catch (error) {
        console.error("เกิดข้อผิดพลาดในการส่งอีเมล:", error);
        return NextResponse.json(
            { 
                success: false,
                message: 'ไม่สามารถส่งอีเมลได้', 
                error: error instanceof Error ? error.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ' 
            },
            { status: 500 }
        );
    }
}
