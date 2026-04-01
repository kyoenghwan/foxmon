'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  FileText, 
  CreditCard, 
  Settings, 
  MessageSquare, 
  HelpCircle, 
  ArrowLeftRight,
  ShieldCheck
} from 'lucide-react';

const ADMIN_MENUS = [
  { id: 'dashboard', label: '대시보드', icon: BarChart3, href: '/fox-office' },
  { id: 'users', label: '회원 관리', icon: Users, href: '/fox-office/users' },
  { id: 'jobs', label: '공고 승인/관리', icon: FileText, href: '/fox-office/jobs' },
  { id: 'ads', label: '광고 및 배너', icon: CreditCard, href: '/fox-office/ads' },
  { id: 'points', label: '정산 및 정책 관리', icon: ArrowLeftRight, href: '/fox-office/points' },
  { id: 'community', label: '커뮤니티 관리', icon: MessageSquare, href: '/fox-office/community' },
  { id: 'support', label: '고객센터', icon: HelpCircle, href: '/fox-office/support' },
  { id: 'settings', label: '시스템 설정', icon: Settings, href: '/fox-office/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1a1c23] min-h-screen text-gray-300 flex flex-col sticky top-0 shadow-2xl z-50">
      {/* Brand Logo */}
      <div className="p-6 border-b border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldCheck className="text-white" size={20} />
        </div>
        <div>
          <h2 className="text-white font-black text-[18px] tracking-tight italic uppercase leading-none">FOX OFFICE</h2>
          <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">MANAGEMENT</p>
        </div>
      </div>

      {/* Menus */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {ADMIN_MENUS.map((menu) => {
          const isActive = pathname === menu.href;
          return (
            <Link 
              key={menu.id} 
              href={menu.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                isActive 
                  ? 'bg-primary text-white font-black shadow-lg shadow-primary/20' 
                  : 'hover:bg-gray-800 hover:text-white font-bold'
              }`}
            >
              <menu.icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary transition-colors'} />
              <span className="text-[14px]">{menu.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-800">
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-xl text-[12px] font-black transition-all border border-gray-700"
        >
          <ArrowLeftRight size={14} />
          사용자 사이트로 이동
        </Link>
        <p className="text-center text-[10px] text-gray-600 mt-4 font-medium uppercase tracking-tight">
          © 2026 Foxmon Admin v1.0
        </p>
      </div>
    </aside>
  );
}
