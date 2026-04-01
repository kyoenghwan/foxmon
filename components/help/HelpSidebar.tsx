'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, HelpCircle, MessageCircle } from 'lucide-react';

const helpNavItems = [
    { href: '/help', label: '공지사항', icon: Bell, exact: true },
    { href: '/help/faq', label: '자주 묻는 질문', icon: HelpCircle },
    { href: '/help/inquiry', label: '1:1 문의', icon: MessageCircle },
];

export function HelpSidebar() {
    const pathname = usePathname();

    return (
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 text-center">
                <span className="text-xl font-black text-gray-900">고객센터</span>
            </div>
            <div className="p-2.5 space-y-1">
                {helpNavItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                                ${isActive
                                    ? 'bg-orange-50 text-primary'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                            `}
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span className={`text-[14px] font-bold ${isActive ? 'text-primary' : ''}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
