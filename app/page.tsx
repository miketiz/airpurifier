"use client";

import "@/styles/dashboardstyle.css";
import { useEffect, useState } from "react";
import { Thermometer, Droplets, Wind, User } from "lucide-react";
import Sidebar from "./components/Sidebar";
import EmptyDeviceState from "./components/EmptyDeviceState";
import LoadingSpinner from "./components/LoadingSpinner"; // เพิ่ม import
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { Line, Bar } from "react-chartjs-2";
import { useTheme } from "./contexts/ThemeContext";
import { useSession } from "next-auth/react";
import Select, {
    components,
    OptionProps,
    SingleValueProps,
    DropdownIndicatorProps,
    GroupBase
} from "react-select";
import { AirVent } from "lucide-react";

// ลงทะเบียน Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface DustData {
    pm25: number;
    temperature: number;
    humidity: number;
    timestamp: string;
}

interface HistoricalDustData {
    hour: string;
    pm25: number;
    temperature: number;
    humidity: number;
    timestamp: string;
}

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

export default function Dashboard() {
    const [temperature, setTemperature] = useState<number>(25);
    const [humidity, setHumidity] = useState<number>(60);
    const [pm25, setPm25] = useState<number>(25);
    const [chartHours, setChartHours] = useState<string[]>([]);
    const [chartData, setChartData] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [historyLoading, setHistoryLoading] = useState<boolean>(true);
    const { darkMode } = useTheme();
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const { data: session } = useSession();

    // state อื่นๆ เหมือนเดิม...
    const [hasDevice, setHasDevice] = useState(false);
    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    
    // เพิ่ม state สำหรับการโหลดข้อมูลอุปกรณ์
    const [isDeviceLoading, setIsDeviceLoading] = useState(true);

    // ฟังก์ชันดึงข้อมูลปัจจุบันจาก API
    const fetchDustData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/dustdata');
            const data = await response.json();
            
            if (data.success && data.data) {
                setTemperature(parseFloat(data.data.temperature));
                setHumidity(parseFloat(data.data.humidity));
                setPm25(parseFloat(data.data.pm25));
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dust data:', error);
            setLoading(false);
        }
    };

    // ฟังก์ชันดึงข้อมูลย้อนหลังจาก API
    const fetchHistoricalData = async () => {
        try {
            setHistoryLoading(true);
            const response = await fetch('/api/dusthistory');
            const data = await response.json();
            
            if (data.success && data.data && Array.isArray(data.data)) {
                // แยกข้อมูลสำหรับกราฟ
                const hours = data.data.map((item: HistoricalDustData) => item.hour);
                const pm25Values = data.data.map((item: HistoricalDustData) => item.pm25);
                
                setChartHours(hours);
                setChartData(pm25Values);
            }
            setHistoryLoading(false);
        } catch (error) {
            console.error('Error fetching historical data:', error);
            setHistoryLoading(false);
        }
    };

    // โหลด device list
    useEffect(() => {
        if (!session?.user?.id) {
            setIsDeviceLoading(false);
            return;
        }
        
        setIsDeviceLoading(true); // เริ่มการโหลด
        
        fetch(`/api/devices?user_id=${session.user.id}`)
            .then(res => res.json())
            .then(data => {
                let devices = [];
                if (Array.isArray(data.data)) {
                    devices = data.data;
                } else if (data.data) {
                    devices = [data.data];
                }
                
                // สำคัญ: อัพเดต state ทั้งหมดพร้อมกัน
                if (devices.length > 0) {
                    setDeviceList(devices);
                    setSelectedDevice(devices[0]);
                    setHasDevice(true);
                } else {
                    setDeviceList([]);
                    setSelectedDevice(null);
                    setHasDevice(false);
                }
                
                // ตั้งค่า loading เป็น false ทีหลังสุด
                setTimeout(() => {
                    setIsDeviceLoading(false); // สิ้นสุดการโหลด
                }, 500); // เพิ่มเวลาเล็กน้อยเพื่อให้แน่ใจว่า state อัพเดตเสร็จแล้ว
            })
            .catch(error => {
                console.error("Error fetching devices:", error);
                // อัพเดตทุก state พร้อมกัน
                setDeviceList([]);
                setSelectedDevice(null);
                setHasDevice(false);
                setIsDeviceLoading(false);
            });
    }, [session?.user?.id]);

    useEffect(() => {
        // ดึงข้อมูลเมื่อโหลดหน้าเว็บ
        fetchDustData();
        fetchHistoricalData();

        // ตั้งเวลาดึงข้อมูลทุก 5 นาที
        const currentDataInterval = setInterval(() => {
            fetchDustData();
        }, 5 * 60 * 1000);
        
        // ตั้งเวลาดึงข้อมูลย้อนหลังทุก 1 ชั่วโมง
        const historicalDataInterval = setInterval(() => {
            fetchHistoricalData();
        }, 60 * 60 * 1000);

        return () => {
            clearInterval(currentDataInterval);
            clearInterval(historicalDataInterval);
        };
    }, []);

    const chartDataConfig = {
        labels: chartHours,
        datasets: [
            {
                label: 'PM 2.5 (µg/m³)',
                data: chartData,
                borderColor: '#e91e63',
                backgroundColor: 'rgba(233, 30, 99, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#e91e63',
                pointBorderColor: darkMode ? '#383c3f' : '#fff',
                pointBorderWidth: 2,
            },
        ],
    };
    

    const chartOptions: ChartOptions<'line' | 'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: darkMode ? 'rgba(233, 236, 239, 0.8)' : 'rgba(44, 62, 80, 0.8)',
                    font: {
                        family: "'Kanit', sans-serif",
                    }
                }
            },
            title: {
                display: true,
                text: 'ค่าฝุ่น PM 2.5 ย้อนหลัง 12 ชั่วโมง',
                color: darkMode ? 'rgba(233, 236, 239, 0.9)' : 'rgba(44, 62, 80, 0.9)',
                font: {
                    size: 18,
                    weight: 'bold',
                    family: "'Kanit', sans-serif",
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    color: darkMode ? 'rgba(233, 236, 239, 0.7)' : 'rgba(44, 62, 80, 0.7)',
                    font: {
                        family: "'Kanit', sans-serif",
                    }
                }
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: darkMode ? 'rgba(233, 236, 239, 0.7)' : 'rgba(44, 62, 80, 0.7)',
                    font: {
                        family: "'Kanit', sans-serif",
                    }
                }
            },
        },
    };

    // ฟังก์ชันแสดงสถานะคุณภาพอากาศ
    const getAirQualityStatus = (pm25Value: number) => {
        if (pm25Value <= 25) return "ดี";
        if (pm25Value <= 50) return "ปานกลาง";
        if (pm25Value <= 100) return "แย่";
        return "อันตราย";
    };

    // ฟังก์ชันเรียกข้อมูลใหม่หลังเพิ่มเครื่อง
    const refreshDeviceList = async () => {
        if (!session?.user?.id) return;
        
        try {
            const res = await fetch(`/api/devices?user_id=${session.user.id}`);
            const data = await res.json();
            
            const devices = Array.isArray(data.data)
                ? data.data
                : data.data
                    ? [data.data]
                    : [];
                    
            setDeviceList(devices);
            setHasDevice(devices.length > 0);
            if (devices.length > 0) {
                setSelectedDevice(devices[0]);
            }
        } catch (error) {
            console.error("Error refreshing devices:", error);
        }
    };

    return (
        <div className={`dashboard-container ${darkMode ? 'dark' : ''}`}>
            <Sidebar />
            <div className="main-content fade-in">
                {isDeviceLoading ? (
                    // แสดงเฉพาะ Loading Spinner ระหว่างโหลดข้อมูล
                    <LoadingSpinner message="กำลังโหลดข้อมูลอุปกรณ์..." />
                ) : (
                    // รอให้ isDeviceLoading เป็น false ก่อนที่จะตัดสินใจว่าจะแสดงอะไร
                    !hasDevice ? (
                        <EmptyDeviceState onDeviceAdded={refreshDeviceList} />
                    ) : (
                        // เนื้อหาเมื่อมีเครื่อง
                        <div className="mm">
                            <div className="welcome-section">
                                <div className="user-info">
                                    <User size={32} className="user-icon" />
                                    <h1 className="font-sriracha">ยินดีต้อนรับ, คุณ {session?.user.name}</h1>
                                </div>
                            </div>
                            
                            {/* ใช้ Select แทน select เดิม */}
                            <div className="device-select-row" style={{ marginBottom: 24 }}>
                                <label htmlFor="select-device" className="device-select-label">
                                    เลือกเครื่อง:
                                </label>
                                <Select<DeviceOptionType, false, GroupBase<DeviceOptionType>>
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    options={deviceList.map((device, idx) => ({
                                        value: String(device.device_id),
                                        label: device.device_name
                                            ? `${device.device_name}`
                                            : `เครื่อง ${idx + 1}`,
                                        isActive: true // สมมติให้เครื่องทำงานอยู่
                                    }))}
                                    value={
                                        selectedDevice
                                            ? {
                                                value: String(selectedDevice.device_id),
                                                label: selectedDevice.device_name || `เครื่อง ${deviceList.findIndex(d => d.device_id === selectedDevice.device_id) + 1}`,
                                                isActive: true
                                              }
                                            : null
                                    }
                                    onChange={(option) => {
                                        if (option && typeof option === 'object' && 'value' in option) {
                                            const found = deviceList.find(d => String(d.device_id) === option.value);
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
                            </div>
                            
                            <div className="dashboard-grid">
                                <div className="card status-card">
                                    <h2 className="font-sriracha status-working">สถานะการทำงาน</h2>
                                    <div className="status-badge">
                                        <span className="status-active">Working</span>
                                    </div>
                                </div>

                                <div className="card dust-card">
                                    <h2 className="font-sriracha">ฝุ่นภายในห้อง</h2>
                                    <div className="dust-info">
                                        <Wind size={40} className="dust-icon" />
                                        <div className="dust-value">
                                            {loading ? (
                                                <span className="loading font-sriracha">กำลังโหลด...</span>
                                            ) : (
                                                <>
                                                    <span className="value">{pm25}</span>
                                                    <span className="unit">µg/m³</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <p className="dust-status">คุณภาพอากาศ: {getAirQualityStatus(pm25)}</p>
                                </div>

                                <div className="card env-card">
                                    <h2 className="font-sriracha">สภาพแวดล้อม</h2>
                                    <div className="env-info">
                                        <div className="env-item">
                                            <Thermometer size={32} className="env-icon" />
                                            <div className="env-value">
                                                {loading ? (
                                                    <span className="loading">กำลังโหลด...</span>
                                                ) : (
                                                    <>
                                                        <span className="value">{temperature}</span>
                                                        <span className="unit">°C</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="env-item">
                                            <Droplets size={32} className="env-icon" />
                                            <div className="env-value">
                                                {loading ? (
                                                    <span className="loading">กำลังโหลด...</span>
                                                ) : (
                                                    <>
                                                        <span className="value">{humidity}</span>
                                                        <span className="unit">%</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="chart-container">
                                <div className="card chart-card">
                                    <div className="chart-wrapper">
                                        {historyLoading ? (
                                            <div className="loading-chart">กำลังโหลดข้อมูลกราฟ...</div>
                                        ) : chartType === "line" ? (
                                            <Line data={chartDataConfig} options={chartOptions} />
                                        ) : (
                                            <Bar data={chartDataConfig} options={chartOptions} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}