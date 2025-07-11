"use client";

import Sidebar from "../components/Sidebar";
import { BarChart, Calendar, Download, Filter } from "lucide-react";
import "@/styles/reportstyle.css";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { useEffect, useState } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EmptyDeviceState from "../components/EmptyDeviceState";
import LoadingSpinner from "../components/LoadingSpinner"; // เพิ่มการ import LoadingSpinner 
import { useSession } from "next-auth/react";

// Register autoTable with jsPDF
(jsPDF as any).API.autoTable = autoTable;

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// เพิ่ม Device interface
interface Device {
    device_id: string | number;
    device_name?: string;
    // เพิ่ม properties อื่นๆ ตามที่จำเป็น
}

export default function Reports() {
    // เพิ่ม state สำหรับการโหลดข้อมูลอุปกรณ์
    const [isDeviceLoading, setIsDeviceLoading] = useState(true);
    
    const [weeklyData, setWeeklyData] = useState<{
        labels: string[];
        values: number[];
        average: string;
    }>({
        labels: [],
        values: [],
        average: "0.0"
    });

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [hasDevice, setHasDevice] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const { data: session } = useSession();

    const fetchWeeklyData = async () => {
        try {
            const response = await fetch('/api/reports');
            const data = await response.json();
            
            if (data.success) {
                setWeeklyData(data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
        if (type === 'start') {
            setStartDate(e.target.value);
        } else {
            setEndDate(e.target.value);
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        // หัวข้อรายงาน
        doc.setFont("helvetica");
        doc.setFontSize(20);
        doc.text('PM 2.5 Weekly Report', 14, 20);
        
        // วันที่ออกรายงาน
        doc.setFontSize(12);
        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Report Generated: ${today}`, 14, 30);
        
        // สร้างข้อมูลตาราง
        const tableData = weeklyData.labels.map((label, index) => [
            label,
            weeklyData.values[index].toFixed(2)
        ]);

        // สร้างตารางข้อมูล
        autoTable(doc, {
            head: [['Date', 'PM 2.5 (µg/m³)']],
            body: tableData,
            startY: 40,
            styles: {
                font: "helvetica",
                fontSize: 12,
                cellPadding: 8
            },
            headStyles: {
                fillColor: [233, 30, 99],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });

        // เพิ่มค่าเฉลี่ย
        const finalY = (doc as any).lastAutoTable.finalY || 40;
        doc.setFontSize(14);
        doc.setTextColor(233, 30, 99);
        doc.text(`Weekly Average: ${weeklyData.average} µg/m³`, 14, finalY + 15);
        
        // บันทึกไฟล์
        const fileName = `PM25_Weekly_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    useEffect(() => {
        fetchWeeklyData();

        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();

        const timer = setTimeout(() => {
            fetchWeeklyData();
        }, timeUntilMidnight);

        return () => clearTimeout(timer);
    }, []);

    // ดึงข้อมูล devices
    useEffect(() => {
        if (!session?.user?.id) {
            setIsDeviceLoading(false); // ถ้าไม่มี session ให้หยุดการโหลด
            return;
        }
        
        setIsDeviceLoading(true); // เริ่มการโหลด
        
        const fetchDevices = async () => {
            try {
                const res = await fetch(`/api/devices?user_id=${session.user.id}`);
                const data = await res.json();
                
                const devices = Array.isArray(data.data)
                    ? data.data
                    : data.data
                        ? [data.data]
                        : [];
                
                // อัพเดต state ทั้งหมด        
                if (devices.length > 0) {
                    setDeviceList(devices);
                    setSelectedDevice(devices[0]);
                    setHasDevice(true);
                } else {
                    setDeviceList([]);
                    setSelectedDevice(null);
                    setHasDevice(false);
                }
                
                // ใช้ setTimeout เพื่อให้แน่ใจว่า state อัพเดตเสร็จก่อน
                setTimeout(() => {
                    setIsDeviceLoading(false); // สิ้นสุดการโหลด
                }, 500);
            } catch (error) {
                console.error("Error fetching devices:", error);
                setDeviceList([]);
                setSelectedDevice(null);
                setHasDevice(false);
                setIsDeviceLoading(false); // สิ้นสุดการโหลดกรณีมีข้อผิดพลาด
            }
        };
        
        fetchDevices();
    }, [session?.user?.id]);

    // ฟังก์ชันเรียกข้อมูลใหม่หลังเพิ่มเครื่อง
    const refreshDeviceList = async () => {
        if (!session?.user?.id) return;
        
        setIsDeviceLoading(true); // เริ่มการโหลดใหม่
        
        try {
            const res = await fetch(`/api/devices?user_id=${session.user.id}`);
            const data = await res.json();
            
            const devices = Array.isArray(data.data)
                ? data.data
                : data.data
                    ? [data.data]
                    : [];
            
            if (devices.length > 0) {
                setDeviceList(devices);
                setSelectedDevice(devices[0]);
                setHasDevice(true);
            } else {
                setDeviceList([]);
                setSelectedDevice(null);
                setHasDevice(false);
            }
            
            setTimeout(() => {
                setIsDeviceLoading(false);
            }, 500);
        } catch (error) {
            console.error("Error refreshing devices:", error);
            setIsDeviceLoading(false);
        }
    };
    
    const chartData = {
        labels: weeklyData.labels,
        datasets: [
            {
                label: 'ค่าฝุ่น PM 2.5 เฉลี่ยรายวัน',
                data: weeklyData.values,
                borderColor: '#e91e63',
                backgroundColor: 'rgba(233, 30, 99, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#e91e63',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }
        ]
    };

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'รายงานค่าฝุ่นประจำสัปดาห์',
                font: {
                    size: 16,
                    weight: 'bold',
                }
            },
        },
    };

    // แก้ไข return statement ให้แสดง Loading Spinner
    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                {isDeviceLoading ? (
                    // แสดง Loading Spinner ระหว่างโหลดข้อมูล
                    <LoadingSpinner message="กำลังโหลดข้อมูล..." />
                ) : !hasDevice ? (
                    // แสดงหน้า "ยังไม่มีเครื่อง" เมื่อโหลดเสร็จแล้วและไม่มีเครื่อง
                    <EmptyDeviceState onDeviceAdded={refreshDeviceList} />
                ) : (
                    // แสดงรายงานเมื่อโหลดเสร็จแล้วและมีเครื่อง
                    <div className="report-container">
                        <div className="report-header">
                            <h1>รายงานและสถิติ</h1>
                            <div className="report-actions">
                                <button 
                                    className="export-btn"
                                    onClick={exportToPDF}
                                >
                                    <Download size={20} />
                                    ส่งออกรายงาน
                                </button>
                            </div>
                        </div>

                        <div className="report-grid">
                            <div className="report-card summary-card">
                                <div className="summary-header">
                                    <BarChart className="summary-icon" />
                                    <h2>สรุปภาพรวม</h2>
                                </div>
                                <div className="summary-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">ค่าฝุ่นเฉลี่ย</span>
                                        <span className="stat-value">{weeklyData.average}</span>
                                        <span className="stat-unit">µg/m³</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">ชั่วโมงการทำงาน</span>
                                        <span className="stat-value">168</span>
                                        <span className="stat-unit">ชั่วโมง</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">ค่าสูงสุด</span>
                                        <span className="stat-value">
                                            {Math.max(...weeklyData.values).toFixed(1)}
                                        </span>
                                        <span className="stat-unit">µg/m³</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">ค่าต่ำสุด</span>
                                        <span className="stat-value">
                                            {Math.min(...weeklyData.values).toFixed(1)}
                                        </span>
                                        <span className="stat-unit">µg/m³</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="report-chart">
                            <div className="chart-card">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}