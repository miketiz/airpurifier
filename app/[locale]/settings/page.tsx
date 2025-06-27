'use client'
import { useState } from "react";
import Sidebar from "../../components/Sidebar";
import { Bell, Moon, Globe, Shield, Volume2 } from "lucide-react";
import "@/styles/settingstyle.css";
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function Settings() {
    const t = useTranslations('settings');
    const router = useRouter();
    
    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLocale = e.target.value;
        router.push(`/${newLocale}/settings`);
    };

    // ... existing code ...
}