'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, FileText, Heart, Eye, Clock, LogIn, Mail, Settings, LogOut, Briefcase, MessageCircle, ChevronDown } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/components/providers/language-provider';
import { SettingsModal } from '@/components/mypage/SettingsModal';
import { ResumeManagementModal } from '@/components/resume/ResumeManagementModal';
import { MarqueeText } from '@/components/ui/marquee-text';
import { userSettingsAction } from '@/lib/actions';
import { supabase } from '@/lib/supabase';
import { QA_GET_CHAT_ROOMS } from '@/src/atoms/qa/foxtalk/QA_GET_CHAT_ROOMS';

interface SessionUser {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    nickname?: string;
}

interface LoginInfoBoxProps {
    session: { user?: SessionUser } | null;
}

export function LoginInfoBox({ session }: LoginInfoBoxProps) {
    const { t } = useLanguage();
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // 프로필 이미지를 DB에서 가져오기
    const fetchProfile = () => {
        if (session?.user?.id) {
            userSettingsAction('GET_PROFILE').then(res => {
                if (res.success && res.data?.profile_image_url) {
                    setProfileImageUrl(res.data.profile_image_url);
                }
            }).catch(() => {});
        }
    };

    const fetchUnreadCount = async () => {
        const userId = session?.user?.id;
        const userRole = session?.user?.role;
        if (!userId) return;

        const res = await QA_GET_CHAT_ROOMS(userId, userRole);
        if (res.success && res.data) {
            const total = res.data.reduce((sum: number, r: any) => sum + (r.unread_count || 0), 0);
            setUnreadCount(total);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [session?.user?.id]);

    useEffect(() => {
        const userId = session?.user?.id;
        if (!userId) return;

        fetchUnreadCount();

        // 실시간 안읽은 카운트 감지를 위한 채널 구독
        const channel = supabase.channel(`unread-count-box:${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'foxtalk_messages'
            }, () => {
                fetchUnreadCount();
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'foxtalk_participants',
                filter: `session_id=eq.${userId}`
            }, () => {
                fetchUnreadCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id]);

    // 설정 모달에서 저장 시 즉시 프로필 이미지 갱신
    useEffect(() => {
        const handleProfileUpdate = () => fetchProfile();
        window.addEventListener('profile-updated', handleProfileUpdate);
        return () => window.removeEventListener('profile-updated', handleProfileUpdate);
    }, [session?.user?.id]);

        if (session && session.user) {
        // Logged In State
        const displayName = (session.user as any).nickname || session.user.name || (session.user.email ? session.user.email.split('@')[0] : '회원');
        const isEmployer = session.user.role === 'EMPLOYER' || session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
        const showResumeMenu = session.user.role !== 'EMPLOYER';
        
        return (
            <div className="h-full w-full bg-white rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm">
                
                {/* Top Section: Avatar & Welcome text (New Layout) */}
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* 프로필 이미지 - 모바일 h-16(64px), sm h-20(80px)으로 세로 대칭 조정 */}
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl sm:rounded-[1rem] bg-orange-50 flex items-center justify-center text-primary shadow-inner shrink-0 overflow-hidden border border-orange-100">
                        {profileImageUrl ? (
                            <img src={profileImageUrl} alt="프로필" className="w-full h-full object-cover" />
                        ) : (
                            <User className="h-8 w-8 sm:h-10 sm:w-10 stroke-[2.5]" />
                        )}
                    </div>

                    {/* 우측 정보 & 버튼 영역 (세로 레이아웃 개편) */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-center">
                        {/* 1. md 이상 (우측 배치 - PC) 레이아웃 */}
                        <div className="hidden md:flex flex-col gap-1.5">
                            {/* 상단 인사말 */}
                            <div className="min-w-0">
                                <MarqueeText className="font-black text-base text-gray-900 leading-tight text-left">
                                    <span className="text-primary">{displayName}</span>님 반갑습니다!
                                </MarqueeText>
                            </div>
                            {/* 프로필 설정 버튼 */}
                            <div className="scale-100 origin-left shrink-0">
                                <SettingsModal />
                            </div>
                        </div>

                        {/* 2. md 미만 (아래쪽 배치 - 모바일) 레이아웃 */}
                        <div className="flex md:hidden flex-col gap-2 w-full">
                            {/* 1행: 인사말 + 프로필 설정 */}
                            <div className="flex items-center justify-between w-full gap-2">
                                <div className="min-w-0 flex-1">
                                    <MarqueeText className="font-black text-[13px] min-[375px]:text-[15px] sm:text-base text-gray-900 leading-tight text-left">
                                        <span className="text-primary">{displayName}</span>님 반갑습니다!
                                    </MarqueeText>
                                </div>
                                <div className="scale-90 min-[375px]:scale-95 origin-right shrink-0">
                                    <SettingsModal />
                                </div>
                            </div>

                            {/* 2행: 이력서/업체 관리 + 더보기(접기/열기) */}
                            <div className="flex items-center justify-between w-full gap-2">
                                <div className="flex items-center gap-1.5">
                                    {showResumeMenu && (
                                        <div className="h-8 [&>button]:px-4 [&>button]:h-full [&>button]:justify-center [&>button]:rounded-full [&>button]:text-[12px] sm:[&>button]:text-[14px]">
                                            <ResumeManagementModal />
                                        </div>
                                    )}
                                    {isEmployer && (
                                        <Link 
                                            href="/biz" 
                                            className="h-8 flex items-center justify-center gap-1.5 px-4 text-[12px] sm:text-[14px] font-black text-white bg-primary hover:bg-orange-600 rounded-full transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                        >
                                            <Briefcase className="w-3.5 h-3.5" />
                                            <span>업체관리</span>
                                        </Link>
                                     )}
                                </div>
                                
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="px-3 py-1 hover:bg-gray-50 rounded-full text-gray-600 hover:text-gray-900 transition-all flex items-center justify-center shrink-0 border border-gray-200 cursor-pointer shadow-sm active:scale-95 text-[11px] sm:text-[12px] font-black"
                                    title={isOpen ? "메뉴 접기" : "더보기"}
                                >
                                    <span className="mr-1">{isOpen ? "접기" : "더보기"}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Icons - 5 핵심 기능 (PC에서는 항상 열림 적용) */}
                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pt-3 sm:pt-4 mt-3 lg:mt-auto' : 'grid-rows-[0fr] opacity-0 overflow-hidden md:grid-rows-[1fr] md:opacity-100 md:pt-4 md:mt-auto md:overflow-visible'}`}>
                    <div className="overflow-hidden flex justify-between items-center px-0.5">
                        <Link href="/mypage/scraps" prefetch={false} className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-gray-50 group-hover:bg-orange-50 transition-all duration-300 text-gray-400 group-hover:text-primary group-hover:scale-110 mx-auto">
                                <Heart className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-current" />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">스크랩 공고</span>
                        </Link>
                        <Link href="/mypage/recent" prefetch={false} className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-gray-50 group-hover:bg-indigo-50 transition-all duration-300 text-gray-400 group-hover:text-indigo-500 group-hover:scale-110 mx-auto">
                                <Clock className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">최근 본 공고</span>
                        </Link>
                        <Link href="/mypage/viewers" prefetch={false} className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1">
                            <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-gray-50 group-hover:bg-emerald-50 transition-all duration-300 text-gray-400 group-hover:text-emerald-500 group-hover:scale-110 mx-auto">
                                <Eye className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">나를 본 업체</span>
                        </Link>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                window.dispatchEvent(new CustomEvent('open_foxtalk'));
                            }}
                            className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1 relative bg-transparent border-0 p-0 cursor-pointer"
                        >
                            <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-gray-50 group-hover:bg-orange-50 transition-all duration-300 text-gray-400 group-hover:text-primary group-hover:scale-110 mx-auto relative">
                                <MessageCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 sm:h-4.5 min-w-[16px] sm:min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] sm:text-[9px] font-black text-white border border-white animate-bounce">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">폭스토크</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Logged Out State
    return (
        <div className="h-full w-full bg-white rounded-2xl border p-5 sm:p-6 flex flex-col justify-center items-center shadow-sm text-center">
            <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-4 tracking-tight">
                {t.loginBox.loginTitle}
            </h3>

            <Link href="/login" className="w-full mb-3">
                <Button size="lg" className="w-full font-black bg-primary hover:bg-primary/90 text-sm h-11 shadow-md">
                    <LogIn className="w-4 h-4 mr-2" /> {t.common.login}
                </Button>
            </Link>

            <div className="flex justify-center gap-6 text-sm text-gray-400 font-bold">
                <Link href="/login?tab=register" className="hover:text-primary transition-colors hover:underline underline-offset-4">{t.common.signup}</Link>
                <Link href="#" className="hover:text-primary transition-colors hover:underline underline-offset-4">{t.loginBox.findAccount}</Link>
            </div>
        </div>
    );
}
