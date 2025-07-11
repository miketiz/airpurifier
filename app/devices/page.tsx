"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "../components/Sidebar";
import {
    Fan, Power, Moon, Gauge, Thermometer, Droplets, Clock,
    PlusCircle, Settings, AirVent, Wind
} from "lucide-react";
import "@/styles/devicestyle.css";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import Select, {
  components,
  OptionProps,
  SingleValueProps,
  DropdownIndicatorProps,
  GroupBase
} from "react-select";
import EmptyDeviceState from "../components/EmptyDeviceState"; // เพิ่ม import
import LoadingSpinner from "../components/LoadingSpinner";

// กำหนด type สำหรับ device
type Device = {
    device_id: string;
    connection_key: string;
    device_name?: string;
    location?: string;
};

// กำหนด type สำหรับ option ของ react-select
type DeviceOptionType = {
    value: string;
    label: string;
    isActive?: boolean;
};

// Custom components สำหรับ react-select
const DeviceOption = (props: OptionProps<DeviceOptionType, false, GroupBase<DeviceOptionType>>) => (
    <components.Option {...props}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0" }}>
            <div style={{
                backgroundColor: props.isSelected ? "#e6f7ff" : "#f0f8ff",
                borderRadius: "50%",
                padding: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <AirVent
                    size={18}
                    style={{
                        color: props.isSelected ? "#0095ff" : "#66b3ff"
                    }}
                />
            </div>
            <span>{props.data.label}</span>
            {props.data.isActive && (
                <span style={{
                    fontSize: "12px",
                    background: "#e6ffed",
                    color: "#52c41a",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    marginLeft: "auto"
                }}>กำลังทำงาน</span>
            )}
        </div>
    </components.Option>
);

const DeviceSingleValue = (props: SingleValueProps<DeviceOptionType, false, GroupBase<DeviceOptionType>>) => (
    <components.SingleValue {...props}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
                backgroundColor: "#f0f8ff",
                borderRadius: "50%",
                padding: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <AirVent size={16} style={{ color: "#0095ff" }} />
            </div>
            <span>{props.data.label}</span>
        </div>
    </components.SingleValue>
);

const DropdownIndicator = (props: DropdownIndicatorProps<DeviceOptionType, false, GroupBase<DeviceOptionType>>) => {
    return (
        <components.DropdownIndicator {...props}>
            <Wind size={18} style={{ color: "#66b3ff" }} />
        </components.DropdownIndicator>
    );
};

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
    const [isDeviceLoading, setIsDeviceLoading] = useState(true);

    const { data: session } = useSession();
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [editName, setEditName] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [showPinModal, setShowPinModal] = useState(false);
    const [showDeviceSetting, setShowDeviceSetting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);

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

    // ใช้ useCallback เพื่อแก้ warning dependency
    const fetchIndoorDustData = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchIndoorDustData();
        const interval = setInterval(() => {
            fetchIndoorDustData();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchIndoorDustData]);

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

    // แก้ไขส่วน useEffect ที่ดึงข้อมูลอุปกรณ์
    useEffect(() => {
        if (!session?.user?.id) {
            console.log("session ยังไม่มี user id", session);
            setIsDeviceLoading(false);
            return;
        }
        
        // ตรวจสอบเพื่อป้องกันการโหลดซ้ำเมื่อเพิ่งสร้าง PIN แต่ยังไม่มีเครื่อง
        if (generatedPin) {
            // ถ้ามีการสร้าง PIN ให้ตรวจสอบก่อนว่ามีเครื่องหรือยัง
            // แต่ไม่ควรแสดง loading screen ในกรณีนี้
            axios.get(`/api/devices?user_id=${session!.user!.id}`)
                .then(res => {
                    const data = res.data;
                    const devices: Device[] = Array.isArray(data.data)
                        ? data.data
                        : data.data
                            ? [data.data]
                            : [];
                    
                    // อัพเดตเฉพาะถ้ามีเครื่อง
                    if (devices.length > 0) {
                        setHasDevice(true);
                        setDeviceList(devices);
                        setSelectedDevice(devices[0]);
                    } else {
                        setHasDevice(false);
                        setDeviceList([]);
                        setSelectedDevice(null);
                    }
                    
                    // ไม่ต้องเปลี่ยน loading state ในกรณีนี้
                })
                .catch((error) => {
                    console.error("Error fetching devices:", error);
                });
            
            return; // ไม่ดำเนินการต่อ
        }
        
        // โหลดข้อมูลตามปกติเมื่อเพิ่งเข้าหน้า
        setIsDeviceLoading(true);
        
        axios.get(`/api/devices?user_id=${session!.user!.id}`)
            .then(res => {
                const data = res.data;
                console.log("API /api/devices response:", data);
                const devices: Device[] = Array.isArray(data.data)
                    ? data.data
                    : data.data
                        ? [data.data]
                        : [];
                console.log("devices ที่ได้:", devices);
                
                // อัพเดต state ทั้งหมด
                if (devices.length > 0) {
                    setHasDevice(true);
                    setDeviceList(devices);
                    setSelectedDevice(devices[0]);
                } else {
                    setHasDevice(false);
                    setDeviceList([]);
                    setSelectedDevice(null);
                }
                
                setTimeout(() => {
                    setIsDeviceLoading(false);
                }, 500);
            })
            .catch((error) => {
                console.error("Error fetching devices:", error);
                setHasDevice(false);
                setDeviceList([]);
                setSelectedDevice(null);
                setIsDeviceLoading(false);
            });
    }, [session, generatedPin]);

    const handleUpdateDevice = async () => {
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
            await axios.patch("/api/devices", payload, { withCredentials: true });
            toast.success("บันทึกข้อมูลสำเร็จ");
        } catch {
            toast.error("เปลี่ยนชื่อ/ที่ตั้งไม่สำเร็จ");
        }
    };

    // const handleDeleteDevice = async () => {
    //     if (!selectedDevice || !session?.user?.id) {
    //         toast.error("กรุณาเข้าสู่ระบบก่อน");
    //         return;
    //     }
    //     if (!window.confirm("คุณต้องการลบอุปกรณ์นี้ใช่หรือไม่?")) return;
    //     try {
    //         await axios.delete("/api/delete-device", {
    //             data: { connection_key: selectedDevice.connection_key },
    //             withCredentials: true,
    //         });
    //         toast.success("ลบอุปกรณ์สำเร็จ");
    //         // รีเฟรช device list
    //         const res = await axios.get(`/api/devices?user_id=${session.user.id}`);
    //         const data = res.data;
    //         const devices: Device[] = Array.isArray(data.data) ? data.data : [data.data];
    //         setDeviceList(devices);
    //         setSelectedDevice(devices[0] || null);
    //         setHasDevice(devices.length > 0);
    //         setShowDeviceSetting(false);
    //     } catch {
    //         toast.error("ลบอุปกรณ์ไม่สำเร็จ");
    //     }
    // };

    // สร้าง options สำหรับ react-select
    const deviceOptions = deviceList.map((device, idx) => ({
        value: device.device_id,
        label: device.device_name
            ? `${device.device_name}`
            : `เครื่อง ${idx + 1}`,
        isActive: power && mode !== 'off' && selectedDevice?.device_id === device.device_id,
    }));

    useEffect(() => {
        if (selectedDevice) {
            setEditName(selectedDevice.device_name || '');
            setEditLocation(selectedDevice.location || '');
        }
    }, [selectedDevice]);

    return (
        <div className="dashboard-container">
            <Toaster />
            <Sidebar />
            <div className="main-content">
                <div className="device-container">
                    {isDeviceLoading ? (
                        // แสดง Loading Spinner ระหว่างโหลดข้อมูล
                        <LoadingSpinner message="กำลังโหลดข้อมูลอุปกรณ์..." />
                    ) : !hasDevice ? (
                        // แสดง EmptyDeviceState หลังจากโหลดเสร็จแล้วและไม่มีเครื่อง
                        <EmptyDeviceState onDeviceAdded={() => {
                            if (!session?.user?.id) return;
                            setIsDeviceLoading(true); // เริ่มโหลดอีกครั้งเมื่อเพิ่มเครื่อง
                            axios.get(`/api/devices?user_id=${session.user.id}`)
                                .then(res => {
                                    const data = res.data;
                                    const devices: Device[] = Array.isArray(data.data)
                                        ? data.data
                                        : data.data
                                            ? [data.data]
                                            : [];
                                    if (devices.length > 0) {
                                        setHasDevice(true);
                                        setDeviceList(devices);
                                        setSelectedDevice(devices[0]);
                                    }
                                    setIsDeviceLoading(false); // สิ้นสุดการโหลด
                                })
                                .catch(error => {
                                    console.error("Error fetching devices:", error);
                                    setIsDeviceLoading(false);
                                });
                        }} />
                    ) : (
                        // แสดงหน้าควบคุมเครื่องเมื่อมีเครื่อง
                        <>
                            <h1 className="device-title">ควบคุมเครื่องฟอกอากาศ</h1>
                            {/* Dropdown หลัก */}
                            <div className="device-select-row">
                                <Select<DeviceOptionType, false, GroupBase<DeviceOptionType>>
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    options={deviceOptions}
                                    value={
                                        selectedDevice
                                            ? deviceOptions.find(opt => opt.value === selectedDevice.device_id)
                                            : null
                                    }
                                    onChange={(option) => {
                                        if (option && typeof option === 'object' && 'value' in option) {
                                            const found = deviceList.find(d => d.device_id === option.value);
                                            setSelectedDevice(found ?? null);
                                        } else {
                                            setSelectedDevice(null);
                                        }
                                    }}
                                    placeholder="เลือกเครื่อง..."
                                    isSearchable={false}
                                    components={{
                                        Option: DeviceOption,
                                        SingleValue: DeviceSingleValue,
                                        DropdownIndicator
                                    }}
                                    styles={{
                                        container: base => ({
                                            ...base,
                                            minWidth: 260,
                                            maxWidth: 340,
                                        }),
                                        control: base => ({
                                            ...base,
                                            borderRadius: 12,
                                            border: "1px solid #e2e8f0",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                            minHeight: 48,
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                borderColor: "#90cdf4"
                                            }
                                        }),
                                        menu: base => ({
                                            ...base,
                                            zIndex: 9999,
                                            overflow: "hidden",
                                            borderRadius: 12,
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                        }),
                                        menuList: base => ({
                                            ...base,
                                            padding: "8px"
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            borderRadius: 8,
                                            padding: "10px 12px",
                                            cursor: "pointer",
                                            backgroundColor: state.isSelected
                                                ? "#ebf8ff"
                                                : state.isFocused
                                                    ? "#f7fafc"
                                                    : "white",
                                            color: state.isSelected ? "#2b6cb0" : "#4a5568",
                                            fontWeight: state.isSelected ? 500 : 400,
                                            "&:hover": {
                                                backgroundColor: state.isSelected ? "#ebf8ff" : "#f7fafc"
                                            },
                                            transition: "all 0.2s ease"
                                        }),
                                        singleValue: base => ({
                                            ...base,
                                            color: "#2d3748",
                                        }),
                                        placeholder: base => ({
                                            ...base,
                                            color: "#a0aec0",
                                        }),
                                        valueContainer: base => ({
                                            ...base,
                                            padding: "2px 16px"
                                        })
                                    }}
                                />
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
                                    className="delete-device-btn"
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(true);
                                    }}
                                >
                                    ลบเครื่อง
                                </button>
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

                            {/* Popup ตั้งเวลาเครื่อง */}
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
                                                style={{ width: "100%", maxWidth: "300px", padding: 8, marginTop: 4, borderRadius: 6, border: "1px solid #ccc" }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: 16 }}>
                                            <label>ที่ตั้ง:</label>
                                            <input
                                                type="text"
                                                value={editLocation}
                                                onChange={e => setEditLocation(e.target.value)}
                                                placeholder="ระบุที่ตั้ง"
                                                style={{ width: "100%", maxWidth: "300px", padding: 8, marginTop: 4, borderRadius: 6, border: "1px solid #ccc" }}
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

                            {/* Modal ยืนยันการลบอุปกรณ์ */}
                            {showDeleteModal && (
                                <div className="delete-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
                                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                                        <h2>ยืนยันการลบอุปกรณ์</h2>
                                        <p>เลือกอุปกรณ์ที่ต้องการลบ (การลบจะไม่สามารถกู้คืนได้)</p>
                                        <select
                                            style={{ width: "100%", padding: 8, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc" }}
                                            value={deleteDeviceId || ""}
                                            onChange={e => setDeleteDeviceId(e.target.value)}
                                        >
                                            <option value="">-- เลือกเครื่อง --</option>
                                            {deviceList.map(device => (
                                                <option key={device.device_id} value={device.connection_key}>
                                                    {device.device_name
                                                        ? `${device.device_name} (${device.connection_key})`
                                                        : `เครื่อง ${device.device_id} (${device.connection_key})`}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="delete-modal-actions">
                                            <button
                                                className="cancel-delete-btn"
                                                type="button"
                                                onClick={() => setShowDeleteModal(false)}
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                className="confirm-delete-btn"
                                                type="button"
                                                disabled={!deleteDeviceId}
                                                onClick={async () => {
                                                    if (!session?.user?.id) {
                                                        toast.error("กรุณาเข้าสู่ระบบก่อน");
                                                        return;
                                                    }
                                                    if (deleteDeviceId) {
                                                        try {
                                                            await axios.delete("/api/delete-device", {
                                                                data: { connection_key: deleteDeviceId },
                                                                withCredentials: true,
                                                            });
                                                            toast.success("ลบอุปกรณ์สำเร็จ");
                                                            setShowDeleteModal(false);
                                                            setDeleteDeviceId(null);
                                                            // รีเฟรช device list
                                                            const res = await axios.get(`/api/devices?user_id=${session.user.id}`);
                                                            const data = res.data;
                                                            const devices: Device[] = Array.isArray(data.data) ? data.data : data.data ? [data.data] : [];
                                                            setDeviceList(devices);
                                                            setSelectedDevice(devices[0] || null);
                                                            setHasDevice(devices.length > 0);
                                                        } catch {
                                                            toast.error("ลบอุปกรณ์ไม่สำเร็จ");
                                                        }
                                                    }
                                                }}
                                            >
                                                ยืนยันการลบ
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
