"use client";

import "@/styles/dashboardstyle.css";
import { useEffect, useState } from "react";
import { Thermometer, Droplets, Wind, User } from "lucide-react";
import Sidebar from "./components/Sidebar";
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

    // เพิ่ม state สำหรับ device
    const [deviceList, setDeviceList] = useState<any[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);

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
        if (!session?.user?.id) return;
        fetch(`/api/devices?user_id=${session.user.id}`)
            .then(res => res.json())
            .then(data => {
                let devices = [];
                if (Array.isArray(data.data)) {
                    devices = data.data;
                } else if (data.data) {
                    devices = [data.data];
                }
                setDeviceList(devices);
                if (devices.length > 0) setSelectedDevice(devices[0]);
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

    return (
        <div className={`dashboard-container ${darkMode ? 'dark' : ''}`}>
            <Sidebar />
            <div className="main-content fade-in">
                <div className="mm">
                <div className="welcome-section">
                    <div className="user-info">
                        <User size={32} className="user-icon" />
                        <h1 className="font-sriracha">ยินดีต้อนรับ, คุณ {session?.user.name}</h1>
                    </div>
                </div>

                {/* ปุ่มเลือกเครื่อง (ตกแต่งใหม่) */}
                <div className="device-select-row" style={{ marginBottom: 24 }}>
                    <label htmlFor="select-device" className="device-select-label">
                        เลือกเครื่อง:
                    </label>
                    <select
                        name="select-device"
                        id="select-device"
                        className="device-select-custom"
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
            </div>
        </div>
    );
}