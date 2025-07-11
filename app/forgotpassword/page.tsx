"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from 'react-hot-toast';
import "@/styles/forgotpassword.css";

export default function ResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [token] = useState(searchParams.get("token") || "");
    const [email, setEmail] = useState("");

    useEffect(() => {
        // ถ้าไม่มี token ให้ redirect กลับไปหน้า login
        if (!token) {
            toast.error("ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน");
            router.push('/login');
            return;
        }

        // ตรวจสอบความถูกต้องของ token
        const checkToken = async () => {
            try {
                const response = await fetch(`/api/reset-password?token=${token}`, {
                    method: 'GET'
                });

                const data = await response.json();
                
                if (data.success && data.email) {
                    setEmail(data.email);
                } else {
                    toast.error(data.message || "Token ไม่ถูกต้องหรือหมดอายุ");
                    router.push('/login');
                }
            } catch (error) {
                console.error("Error checking token:", error);
                toast.error("เกิดข้อผิดพลาดในการตรวจสอบ Token");
                router.push('/login');
            }
        };

        checkToken();
    }, [token, router]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("รหัสผ่านไม่ตรงกัน!");
            return;
        }

        if (password.length < 8) {
            toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
            return;
        }

        try {
            const response = await fetch("/api/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-email": email  // ส่ง email ผ่าน header
                },
                body: JSON.stringify({
                    token: token,
                    password: password
                }),
            });

            const data = await response.json();
            console.log('Reset password response:', data);

            if (data.success) {
                toast.success("เปลี่ยนรหัสผ่านสำเร็จ!");
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
            } else {
                toast.error(data.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
            }
        } catch (error) {
            console.error("Error resetting password:", error);
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
        }
    };

    return (
        <div className="reset-password-page">
            <div className="reset-password-container">
                <h1 className="reset-password-title">รีเซ็ตรหัสผ่าน</h1>
                <form onSubmit={handleResetPassword} className="reset-password-form">
                    <div className="input-field">
                        <label htmlFor="password">รหัสผ่านใหม่</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="กรอกรหัสผ่านใหม่"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-field">
                        <label htmlFor="confirm-password">ยืนยันรหัสผ่าน</label>
                        <input
                            id="confirm-password"
                            type="password"
                            placeholder="ยืนยันรหัสผ่านใหม่"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="button-all">
                        <button type="submit" className="reset-password-button">
                            เปลี่ยนรหัสผ่าน
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}