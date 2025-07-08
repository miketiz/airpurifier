"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "../components/Sidebar";
import { Fan, Power, Moon, Gauge, Thermometer, Droplets, Clock, PlusCircle, Settings } from "lucide-react";
import "@/styles/devicestyle.css";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";

export default function Devices() {
    const [power, setPower] = useState(false);
    const [mode, setMode] = useState('off');
    const [pm25, setPm25] = useState(0);
    const [temperature, setTemperature] = useState(0);
    const [humidity, setHumidity] = useState(0);
    const [aqi, setAqi] = useState(0);
    const [airQualityStatus, setAirQualityStatus] = useState('');
    const [loading, setLoading] = useState(true);

    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('18:00');
    const [scheduleDays, setScheduleDays] = useState([
        false, true, true, true, true, true, false
    ]);
    const [scheduleMode, setScheduleMode] = useState('medium');

    // เพิ่ม state สำหรับจำลองว่ามีเครื่องหรือไม่
    const [hasDevice, setHasDevice] = useState(false);
    const [pin, setPin] = useState("");
    const [deviceName, setDeviceName] = useState("");
    const [formError, setFormError] = useState("");

    const { data: session } = useSession();
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [deviceList, setDeviceList] = useState<any[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);
    const [editName, setEditName] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showDeviceSetting, setShowDeviceSetting] = useState(false);

    const calculateAQI = (pm25Value: number) => {
        if (pm25Value <= 12.0) return Math.round((50 - 0) / (12.0 - 0) * (pm25Value - 0) + 0);
        else if (pm25Value <= 35.4) return Math.round((100 - 51) / (35.4 - 12.1) * (pm25Value - 12.1) + 51);
        else if (pm25Value <= 55.4) return Math.round((150 - 101) / (55.4 - 35.5) * (pm25Value - 35.5) + 101);
        else if (pm25Value <= 150.4) return Math.round((200 - 151) / (150.4 - 55.5) * (pm25Value - 55.5) + 151);
        else if (pm25Value <= 250.4) return Math.round((300 - 201) / (250.4 - 150.5) * (pm25Value - 150.5) + 201);
        else if (pm25Value <= 350.4) return Math.round((400 - 301) / (350.4 - 250.5) * (pm25Value - 250.5) + 301);
        else return Math.round((500 - 401) / (500.4 - 350.5) * (pm25Value - 350.5) + 401);
    };

    const getAirQualityStatus = (aqiValue: number) => {
        if (aqiValue <= 50) return "ดีมาก";
        if (aqiValue <= 100) return "ดี";
        if (aqiValue <= 150) return "ปานกลาง";
        if (aqiValue <= 200) return "แย่";
        if (aqiValue <= 300) return "แย่มาก";
        return "อันตราย";
    };

    const fetchIndoorDustData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/dustdata');
            const data = await response.json();
            if (data.success && data.data) {
                const pm25Value = parseFloat(data.data.pm25);
                setPm25(pm25Value);
                setTemperature(parseFloat(data.data.temperature));
                setHumidity(parseFloat(data.data.humidity));
                const aqiValue = calculateAQI(pm25Value);
                setAqi(aqiValue);
                setAirQualityStatus(getAirQualityStatus(aqiValue));
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dust data:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIndoorDustData();
        const interval = setInterval(() => {
            fetchIndoorDustData();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const handlePowerToggle = () => {
        setPower(!power);
        if (!power) setMode('medium');
        else setMode('off');
    };

    const handleModeChange = (newMode: string) => {
        if (power) setMode(newMode);
    };

    const handleScheduleToggle = () => {
        setScheduleEnabled(!scheduleEnabled);
    };

    const handleDayToggle = (index: number) => {
        const newDays = [...scheduleDays];
        newDays[index] = !newDays[index];
        setScheduleDays(newDays);
    };

    const handleScheduleModeChange = (mode: string) => {
        setScheduleMode(mode);
    };

    const handleAddDevice = () => {
        if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
            setFormError("กรุณากรอก PIN 6 หลัก (ตัวเลขเท่านั้น)");
            return;
        }
        if (!deviceName.trim()) {
            setFormError("กรุณาตั้งชื่อเครื่อง");
            return;
        }
        setFormError("");
        setHasDevice(true);
    };
    const handleGeneratePin = async (showModal = false) => {
        setIsGenerating(true);
        if (!session?.user?.id) {
            alert("ไม่พบ user id");
            setIsGenerating(false);
            return;
        }
        const res = await fetch('/api/device-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: session.user.id }),
        });
        const data = await res.json();
        if (data && data.pin_key) {
            setGeneratedPin(data.pin_key);
            if (showModal) setShowPinModal(true); // เปิด modal เฉพาะกรณีที่ต้องการ
        }
        setIsGenerating(false);
    };

    useEffect(() => {
        if (!session?.user?.id) {
            console.log("session ยังไม่มี user id", session);
            return;
        }
        axios.get(`/api/devices?user_id=${session.user.id}`)
            .then(res => {
                const data = res.data;
                console.log("API /api/devices response:", data);
                let devices = [];
                if (Array.isArray(data.data)) {
                    devices = data.data;
                } else if (data.data) {
                    devices = [data.data];
                }
                console.log("devices ที่ได้:", devices);
                if (devices.length > 0) {
                    setHasDevice(true);
                    setDeviceList(devices);
                    setSelectedDevice(devices[0]);
                } else {
                    setHasDevice(false);
                    setDeviceList([]);
                    setSelectedDevice(null);
                }
            })
            .catch((err) => {
                setHasDevice(false);
                setDeviceList([]);
                setSelectedDevice(null);
                console.log("API error", err);
            });
    }, [session?.user?.id, generatedPin]);

    const handleUpdateDevice = async () => {
        console.log("session", session);
        if (!selectedDevice || !session?.user?.id) {
            toast.error("กรุณาเข้าสู่ระบบก่อน");
            return;
        }
        try {
            const payload = {
                connection_key: selectedDevice.connection_key,
                device_name: editName,
                location: editLocation
            };
            console.log("payload", payload);
            await axios.patch("/api/devices", payload, { withCredentials: true });
            setIsEditing(false);
            toast.success("บันทึกข้อมูลสำเร็จ");
        } catch (err) {
            toast.error("เปลี่ยนชื่อ/ที่ตั้งไม่สำเร็จ");
        }
    };

    return (
        <div className="dashboard-container">
            <Toaster />
            <Sidebar />
            <div className="main-content">
                <div className="device-container">
                    {!hasDevice ? (
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
                        </div>
                    ) : (
                        <>
                            <h1 className="device-title">ควบคุมเครื่องฟอกอากาศ</h1>
                            {/* Dropdown หลัก */}
                            <div className="device-select-row">
                                <select
                                    name="select-device"
                                    id="select-device"
                                    className="device-select"
                                    value={selectedDevice?.device_id ? String(selectedDevice.device_id) : ""}
                                    onChange={e => {
                                        const found = deviceList.find(
                                            d => String(d.device_id) === e.target.value
                                        );
                                        setSelectedDevice(found);
                                    }}
                                >
                                    {deviceList.map((device, idx) => (
                                        <option key={`main-${device.device_id}`} value={String(device.device_id)}>
                                            {device.device_name
                                                ? `เครื่อง ${idx + 1} (${device.device_name})`
                                                : `เครื่อง ${idx + 1} (ยังไม่มีชื่อเครื่อง)`}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleGeneratePin(true)}
                                    disabled={isGenerating}
                                    className="select-device-btn"
                                    type="button"
                                >
                                    <PlusCircle size={20} />
                                    {isGenerating ? "กำลังสร้าง..." : "เพิ่มเครื่อง"}
                                </button>
                                {/* ปุ่มตั้งค่าเครื่อง */}
                                <button
                                    className="device-setting-btn"
                                    type="button"
                                    style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 4 }}
                                    onClick={() => setShowDeviceSetting(true)}
                                    disabled={!selectedDevice}
                                >
                                    <Settings size={20} />
                                    ตั้งค่าเครื่อง
                                </button>
                            </div>
                            <div className="air-quality-grid">
                                <div className="air-quality-card">
                                    <h3>PM 2.5</h3>
                                    <div className="value">{loading ? "กำลังโหลด..." : pm25}</div>
                                    <div className="unit">µg/m³</div>
                                </div>
                                <div className="air-quality-card">
                                    <h3>AQI</h3>
                                    <div className="value">{loading ? "กำลังโหลด..." : aqi}</div>
                                    <div className="status">คุณภาพอากาศ{airQualityStatus}</div>
                                </div>
                                <div className="air-quality-card temp-humid-card">
                                    <h3>สภาพแวดล้อม</h3>
                                    <div className="temp-humid-container">
                                        <div className="temp-section">
                                            <Thermometer size={30} />
                                            <div className="value">{loading ? "..." : temperature}</div>
                                            <div className="unit">°C</div>
                                        </div>
                                        <div className="humid-section">
                                            <Droplets size={30} />
                                            <div className="value">{loading ? "..." : humidity}</div>
                                            <div className="unit">%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="device-status-card">
                                <div className="status-header">
                                    <Fan
                                        className={`device-icon${power && mode !== 'off' ? ' spinning' : ''}`}
                                        size={48}
                                    />
                                    <h2>สถานะการทำงาน</h2>
                                </div>
                                <div className="status-content">
                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                        <p
                                            className={
                                                `current-mode-highlight${mode === 'off' ? ' mode-off' : ''}`
                                            }
                                        >
                                            โหมดปัจจุบัน: {
                                                mode === 'high' ? 'แรง' :
                                                    mode === 'medium' ? 'ปานกลาง' :
                                                        mode === 'low' ? 'เบา' :
                                                            mode === 'auto' ? 'อัตโนมัติ' :
                                                                mode === 'sleep' ? 'กลางคืน' : 'ปิด'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="device-controls">
                                <button className={`control-btn power-btn ${power ? 'active' : ''}`} onClick={handlePowerToggle}>
                                    <Power size={24} /><span>{power ? 'ปิด' : 'เปิด'}</span>
                                </button>
                                <button className={`control-btn ${mode === 'high' ? 'active' : ''}`} onClick={() => handleModeChange('high')} disabled={!power}>
                                    <Gauge size={24} /><span>แรง</span>
                                </button>
                                <button className={`control-btn ${mode === 'medium' ? 'active' : ''}`} onClick={() => handleModeChange('medium')} disabled={!power}>
                                    <Gauge size={24} /><span>ปานกลาง</span>
                                </button>
                                <button className={`control-btn ${mode === 'low' ? 'active' : ''}`} onClick={() => handleModeChange('low')} disabled={!power}>
                                    <Gauge size={24} /><span>เบา</span>
                                </button>
                                <button className={`control-btn ${mode === 'auto' ? 'active' : ''}`} onClick={() => handleModeChange('auto')} disabled={!power}>
                                    <Fan size={24} /><span>อัตโนมัติ</span>
                                </button>
                                <button className={`control-btn ${mode === 'sleep' ? 'active' : ''}`} onClick={() => handleModeChange('sleep')} disabled={!power}>
                                    <Moon size={24} /><span>กลางคืน</span>
                                </button>
                            </div>

                            {/* การ์ดตั้งเวลา */}
                            <div className="schedule-card">
                                <div className="schedule-header">
                                    <Clock className="schedule-icon" size={32} />
                                    <h2>ตั้งเวลาการทำงาน</h2>
                                    <div className="toggle-switch">
                                        <input type="checkbox" id="schedule-toggle" checked={scheduleEnabled} onChange={handleScheduleToggle} />
                                        <label htmlFor="schedule-toggle"></label>
                                    </div>
                                </div>
                                <div className={`schedule-content ${!scheduleEnabled ? 'disabled' : ''}`}>
                                    <div className="time-settings">
                                        <div className="time-group">
                                            <label htmlFor="start-time">เวลาเริ่มทำงาน</label>
                                            <input type="time" id="start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                        </div>
                                        <div className="time-group">
                                            <label htmlFor="end-time">เวลาหยุดทำงาน</label>
                                            <input type="time" id="end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="days-selection">
                                        <h3>วันที่ทำงาน</h3>
                                        <div className="days-grid">
                                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
                                                <div key={index} className={`day-item ${scheduleDays[index] ? 'active' : ''}`} onClick={() => handleDayToggle(index)}>
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="schedule-mode">
                                        <h3>โหมดการทำงาน</h3>
                                        <div className="mode-buttons">
                                            {['high', 'medium', 'low', 'auto'].map((m) => (
                                                <button key={m} className={`mode-btn ${scheduleMode === m ? 'active' : ''}`} onClick={() => handleScheduleModeChange(m)}>
                                                    <Gauge size={20} /><span>{m === 'high' ? 'แรง' : m === 'medium' ? 'ปานกลาง' : m === 'low' ? 'เบา' : 'อัตโนมัติ'}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Popup ตั้งค่าเครื่อง */}
                            {showDeviceSetting && (
                                <div className="device-setting-modal-backdrop" onClick={() => setShowDeviceSetting(false)}>
                                    <div className="device-setting-modal" onClick={e => e.stopPropagation()}>
                                        <h2>ตั้งค่าเครื่อง</h2>
                                        <div style={{ marginBottom: 16 }}>
                                            <label>ชื่อเครื่อง:</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                placeholder="ตั้งชื่อเครื่อง"
                                                style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 6, border: "1px solid #ccc" }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: 16 }}>
                                            <label>ที่ตั้ง:</label>
                                            <input
                                                type="text"
                                                value={editLocation}
                                                onChange={e => setEditLocation(e.target.value)}
                                                placeholder="ระบุที่ตั้ง"
                                                style={{ width: "100%", padding: 8, marginTop: 4, borderRadius: 6, border: "1px solid #ccc" }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                            <button
                                                className="cancel-setting-btn"
                                                type="button"
                                                onClick={() => setShowDeviceSetting(false)}
                                                style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#bbb", color: "#fff" }}
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                className="save-setting-btn"
                                                type="button"
                                                onClick={async () => {
                                                    await handleUpdateDevice();
                                                    setShowDeviceSetting(false);
                                                }}
                                                style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#26c42e", color: "#fff" }}
                                            >
                                                บันทึก
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal แสดง PIN เฉพาะปุ่มข้าง select */}
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
