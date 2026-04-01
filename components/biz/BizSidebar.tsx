'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    Megaphone, 
    Coins, 
    Users, 
    Building2,
} from 'lucide-react';

const navItems = [
    { 
        href: '/biz', 
        label: '대시보드', 
        icon: LayoutDashboard,
        exact: true
    },
    { 
        href: '/biz/ads', 
        label: '광고 관리', 
        icon: Megaphone,
    },
    { 
        href: '/biz/points', 
        label: '포인트 관리', 
        icon: Coins,
    },
    { 
        href: '/biz/seekers', 
        label: '지원자 관리', 
        icon: Users,
    },
    { 
        href: '/biz/profile', 
        label: '업체 정보', 
        icon: Building2,
    },
];

export function BizSidebar() {
    const pathname = usePathname();

    return (
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* 섹션 타이틀 */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-[11px] font-black text-gray-500 tracking-wider uppercase">업체 관리</span>
            </div>

            {/* Nav Items */}
            <div className="p-2 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = item.exact 
                        ? pathname === item.href 
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all group
                                ${isActive 
                                    ? 'bg-orange-50 text-primary' 
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                            `}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[13px] font-bold ${isActive ? 'text-primary' : ''}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100">
                <Link href="/" className="text-[11px] font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
                    ← 메인으로
                </Link>
            </div>
        </nav>
    );
}
