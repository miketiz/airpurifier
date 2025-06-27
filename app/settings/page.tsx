'use client'
import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Bell, Moon, Volume2 } from "lucide-react";
import "@/styles/settingstyle.css";
import "@/styles/components.css";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-hot-toast";

export default function Settings() {
    const { darkMode, toggleDarkMode } = useTheme();
    const [dustThreshold, setDustThreshold] = useState(25);

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDustThreshold(Number(e.target.value));
    };

    const saveThreshold = async () => {
        try {
            const response = await fetch('/api/settings/threshold', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ threshold: dustThreshold }),
            });
            
            if (response.ok) {
                toast.success('บันทึกการตั้งค่าสำเร็จ');
            } else {
                toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
            }
        } catch (error) {
            toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <div className="settings-container fade-in">
                    <h1 className="settings-title">ตั้งค่า</h1>
                    
                    <div className="settings-grid">
                        <div className="settings-card">
                            <div className="settings-header">
                                <Bell className="settings-icon" size={24} />
                                <h2>การแจ้งเตือน</h2>
                            </div>
                            <div className="settings-content">
                                <div className="settings-item">
                                    <label>แจ้งเตือนค่าฝุ่นเกินกำหนด</label>
                                    <input type="checkbox" className="toggle-switch" />
                                </div>
                                <div className="settings-item">
                                    <label>ค่าฝุ่นที่ต้องการแจ้งเตือน (µg/m³)</label>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="100" 
                                        value={dustThreshold} 
                                        onChange={handleThresholdChange} 
                                        className="threshold-slider" 
                                    />
                                    <span className="threshold-value">{dustThreshold}</span>
                                </div>
                                <div className="settings-item">
                                    <button className="save-threshold-btn" onClick={saveThreshold}>บันทึกการตั้งค่า</button>
                                </div>
                                <div className="settings-item">
                                    <label>แจ้งเตือนสถานะอุปกรณ์</label>
                                    <input type="checkbox" className="toggle-switch" />
                                </div>
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-header">
                                <Moon className="settings-icon" size={24} />
                                <h2>ธีม</h2>
                            </div>
                            <div className="settings-content">
                                <div className="settings-item">
                                    <label>โหมดกลางคืน</label>
                                    <input 
                                        type="checkbox" 
                                        className="toggle-switch"
                                        checked={darkMode}
                                        onChange={toggleDarkMode}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-header">
                                <Volume2 className="settings-icon" size={24} />
                                <h2>เสียง</h2>
                            </div>
                            <div className="settings-content">
                                <div className="settings-item">
                                    <label>เสียงแจ้งเตือน</label>
                                    <input type="checkbox" className="toggle-switch" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}