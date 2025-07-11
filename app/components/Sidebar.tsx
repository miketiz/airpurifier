"use client";
import "@/styles/sidebarstyle.css";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Settings, User, BarChart, Fan, Menu, LogOut } from "lucide-react";
import logo from "@/public/img/Logo/102.ico";
import { useTheme } from "../contexts/ThemeContext";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast"; // เพิ่ม import toast

interface SidebarProps {
    className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const { darkMode } = useTheme();

    const handleNavigation = (path: string) => {
        router.push(path);
    };
    
    const handleLogout = async () => {
        try {
            await signOut({
                redirect: false,
                callbackUrl: "/login"
            });
            
            // Toast แบบสวยงาม
            toast.success("ออกจากระบบสำเร็จ", {
                icon: '👋',
                duration: 3000,
                style: {
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                    color: '#fff',
                    padding: '16px 24px',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)',
                    fontSize: '15px',
                    fontWeight: '500',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                },
            });
            
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
            // แจ้งเตือนข้อผิดพลาดแบบสวยงาม
            toast.error("เกิดข้อผิดพลาดขณะออกจากระบบ", {
                icon: '⚠️',
                duration: 4000,
                style: {
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                    color: '#fff',
                    padding: '16px 24px',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                    fontSize: '15px',
                    fontWeight: '500',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                },
            });
        }
    };
    

    useEffect(() => {
        // เพิ่มหรือลบคลาส sidebar-collapsed จาก main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            if (isCollapsed) {
                mainContent.classList.add('sidebar-collapsed');
            } else {
                mainContent.classList.remove('sidebar-collapsed');
            }
        }
    }, [isCollapsed]);

    return (
        <>
            <button
                className={`mobile-menu-button ${darkMode ? 'dark' : ''}`}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <Menu size={24} />
            </button>
            <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${className} ${darkMode ? 'dark' : ''}`}>
                <div className="sidebar-header">
                    <div
                        className="logo-container"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{ cursor: 'pointer' }}
                    >
                        <Image src={logo} alt="Logo" width={50} height={50} />
                        <h1 className="logo-text">MM-AIR</h1>
                    </div>
                </div>
                <nav className="nav-menu">
                    <div
                        className={`nav-item ${pathname === '/' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/')}
                    >
                        <Home size={24} />
                        <span>หน้าหลัก</span>
                    </div>
                    <div
                        className={`nav-item ${pathname === '/devices' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/devices')}
                    >
                        <Fan size={24} />
                        <span>อุปกรณ์</span>
                    </div>
                    <div
                        className={`nav-item ${pathname === '/reports' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/reports')}
                    >
                        <BarChart size={24} />
                        <span>รายงาน</span>
                    </div>
                    <div
                        className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/profile')}
                    >
                        <User size={24} />
                        <span>โปรไฟล์</span>
                    </div>
                    <div
                        className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/settings')}
                    >
                        <Settings size={24} />
                        <span>ตั้งค่า</span>
                    </div>
                    <div className="nav-item"
                        onClick={handleLogout}>
                        <LogOut size={24} />
                        <span>ออกจากระบบ</span>
                    </div>
                </nav>
            </div>
        </>
    );
}
