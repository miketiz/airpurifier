"use client";
import "@/styles/sidebarstyle.css";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Settings, User, BarChart, Fan, Menu, LogOut } from "lucide-react";
import logo from "@/public/img/Logo/102.ico";
import { toast } from "react-hot-toast";
import { useTheme } from "../contexts/ThemeContext";
import { signOut, useSession } from "next-auth/react";
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
            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);
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
