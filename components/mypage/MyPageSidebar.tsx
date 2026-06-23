'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { User, FileText, Clock, Eye, Heart, HelpCircle, MessageSquare, LogOut, Briefcase } from 'lucide-react';
import { getUserActivityCounts } from '@/lib/actions/community';

export function MyPageSidebar({ isMobile = false }: { isMobile?: boolean }) {
    const { data: session } = useSession();
    const pathname = usePathname();
    
    const [appCount, setAppCount] = useState(0);
    const [recentCount, setRecentCount] = useState(0);
    const [scrapCount, setScrapCount] = useState(0);
    const [postCount, setPostCount] = useState(0);
    
    // 로컬 스토리지 및 DB 카운트 페칭
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const apps = localStorage.getItem('foxmon_applications');
            setAppCount(apps ? JSON.parse(apps).length : 0);
            
            const recents = localStorage.getItem('foxmon_recent');
            setRecentCount(recents ? JSON.parse(recents).length : 0);
            
            const scraps = localStorage.getItem('foxmon_scraps');
            setScrapCount(scraps ? JSON.parse(scraps).length : 0);
        }
        
        const fetchDbCounts = async () => {
            if (session?.user?.id) {
                const res = await getUserActivityCounts(session.user.id);
                if (res.success) {
                    setPostCount(res.postCount);
                }
            }
        };
        fetchDbCounts();
    }, [session?.user?.id, pathname]);

    if (!session) return null;

    const sections = [
        {
            title: '프로필',
            items: [
                {
                    id: 'activity',
                    label: `내 활동 ${postCount}`,
                    icon: FileText,
                    href: '/mypage/activity'
                },
                {
                    id: 'applications',
                    label: `나의 공고 ${appCount}`,
                    icon: Briefcase,
                    href: '/mypage/applications'
                },
                {
                    id: 'recent',
                    label: `최근기록 ${recentCount}`,
                    icon: Clock,
                    href: '/mypage/recent'
                },
                {
                    id: 'viewers',
                    label: '나를 본 업체',
                    icon: Eye,
                    href: '/mypage/viewers'
                }
            ]
        },
        {
            title: '스크랩',
            items: [
                {
                    id: 'scraps',
                    label: `좋아요 ${scrapCount}`,
                    icon: Heart,
                    href: '/mypage/scraps'
                }
            ]
        },
        {
            title: '고객센터',
            items: [
                {
                    id: 'faq',
                    label: 'FAQ',
                    icon: HelpCircle,
                    href: '/help/faq'
                },
                {
                    id: 'inquiry',
                    label: '문의내역',
                    icon: MessageSquare,
                    href: '/help/inquiry'
                }
            ]
        }
    ];

    if (isMobile) {
        // 모바일 가로 탭 렌더링
        const allItems = sections.flatMap(s => s.items);
        return (
            <div className="w-full bg-white py-2 overflow-x-auto scrollbar-hide border-b border-gray-100">
                <div className="flex gap-1.5 px-4 whitespace-nowrap">
                    {allItems.map((item) => {
                        const isActive = item.href ? pathname === item.href : false;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    isActive
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                    <button
                        onClick={async () => {
                            document.cookie = "foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            await signOut({ callbackUrl: '/login' });
                        }}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all"
                    >
                        로그아웃
                    </button>
                </div>
            </div>
        );
    }

    return (
        <aside className="w-56 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-[130px]">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 text-center">
                <span className="text-base font-black text-gray-900">마이페이지</span>
            </div>
            
            <div className="divide-y divide-gray-100">
                {sections.map((section, idx) => (
                    <div key={section.title || idx} className="py-3 px-2">
                        {section.title && (
                            <div className="px-3 py-1 mb-1">
                                <span className="text-[10px] font-black text-gray-400 tracking-wider">
                                    {section.title}
                                </span>
                            </div>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const isActive = item.href ? pathname === item.href : false;
                                const Icon = item.icon;
                                const className = `w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group text-left ${
                                    isActive
                                        ? 'bg-orange-50 text-primary font-black'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-bold'
                                }`;

                                const content = (
                                    <>
                                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                        <span className="text-[13px]">{item.label}</span>
                                        {isActive && <span className="ml-auto w-1 h-1 bg-primary rounded-full" />}
                                    </>
                                );

                                return (
                                    <Link key={item.id} href={item.href} className={className}>
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
                
                <div className="py-2 px-2">
                    <button
                        onClick={async () => {
                            if (window.confirm('정말 로그아웃 하시겠습니까?')) {
                                document.cookie = "foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                                await signOut({ callbackUrl: '/login' });
                            }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-all font-bold text-left cursor-pointer"
                    >
                        <LogOut className="w-4 h-4 shrink-0 text-red-400" />
                        <span className="text-[13px]">로그아웃</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
