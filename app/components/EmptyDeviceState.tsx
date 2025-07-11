"use client";

import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import "@/styles/EmptyDevice.css"; // ใช้ไฟล์ CSS เฉพาะสำหรับ EmptyDeviceState

interface EmptyDeviceStateProps {
    onDeviceAdded?: () => void; // callback เมื่อเพิ่มเครื่องสำเร็จ
}

export default function EmptyDeviceState({ onDeviceAdded }: EmptyDeviceStateProps) {
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [deviceAdded, setDeviceAdded] = useState(false); // เพิ่ม state นี้
    const { data: session } = useSession();

    // ตรวจสอบว่ามีเครื่องเพิ่มเข้ามาหรือยัง
    useEffect(() => {
        if (generatedPin && deviceAdded) {
            // ถ้ามีการสร้าง PIN และกำหนดว่ามีการเพิ่มเครื่อง
            const checkDeviceInterval = setInterval(async () => {
                if (!session?.user?.id) {
                    clearInterval(checkDeviceInterval);
                    return;
                }
                
                try {
                    const res = await fetch(`/api/devices?user_id=${session.user.id}`);
                    const data = await res.json();
                    
                    const devices = Array.isArray(data.data)
                        ? data.data
                        : data.data
                            ? [data.data]
                            : [];
                    
                    if (devices.length > 0) {
                        // พบเครื่องใหม่
                        clearInterval(checkDeviceInterval);
                        
                        // เรียก callback
                        if (onDeviceAdded) {
                            onDeviceAdded();
                        }
                        
                        setDeviceAdded(false); // รีเซ็ตสถานะ
                    }
                } catch (error) {
                    console.error("Error checking device:", error);
                }
            }, 3000); // ตรวจสอบทุก 3 วินาที
            
            // ล้าง interval เมื่อ unmount
            return () => {
                clearInterval(checkDeviceInterval);
            };
        }
    }, [generatedPin, deviceAdded, session?.user?.id, onDeviceAdded]);

    const handleGeneratePin = async (showModal = false) => {
        setIsGenerating(true);
        if (!session?.user?.id) {
            toast.error("กรุณาเข้าสู่ระบบก่อน");
            setIsGenerating(false);
            return;
        }
        
        try {
            const res = await fetch('/api/device-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: session.user.id }),
            });
            const data = await res.json();
            
            if (data && data.pin_key) {
                setGeneratedPin(data.pin_key);
                if (showModal) setShowPinModal(true);
                
                // เมื่อมีการสร้าง PIN สำเร็จ ให้กำหนดว่าอาจมีการเพิ่มเครื่อง
                setDeviceAdded(true);
            } else {
                toast.error("ไม่สามารถสร้าง PIN ได้");
            }
        } catch (error) {
            console.error("Error generating PIN:", error);
            toast.error("เกิดข้อผิดพลาดในการสร้าง PIN");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="add-device-empty">
            <span style={{ marginBottom: 24 }}>ยังไม่มีเครื่อง</span>
            {generatedPin ? (
                <div className="pin-card">
                    <div className="pin-title">PIN 6 หลัก ของคุณคือ</div>
                    <div className="pin-value">{generatedPin}</div>
                    <div className="pin-desc">นำ PIN นี้ไปเพิ่มอุปกรณ์ในแอปหรืออุปกรณ์จริง</div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => handleGeneratePin(false)}
                    disabled={isGenerating}
                    className="add-device-btn"
                >
                    <PlusCircle size={24} /> {isGenerating ? "กำลังสร้าง..." : "เพิ่มเครื่อง"}
                </button>
            )}
            
            {/* Modal แสดง PIN */}
            {showPinModal && (
                <div className="pin-modal-backdrop" onClick={() => setShowPinModal(false)}>
                    <div className="pin-modal" onClick={e => e.stopPropagation()}>
                        <div className="pin-title">PIN 6 หลัก ของคุณคือ</div>
                        <div className="pin-value">{generatedPin}</div>
                        <div className="pin-desc">นำ PIN นี้ไปเพิ่มอุปกรณ์ในแอปหรืออุปกรณ์จริง</div>
                        <button className="close-pin-modal-btn" onClick={() => setShowPinModal(false)}>ปิด</button>
                    </div>
                </div>
            )}
        </div>
    );
}