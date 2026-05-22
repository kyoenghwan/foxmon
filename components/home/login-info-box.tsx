'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, FileText, Heart, Eye, Clock, LogIn, Mail, Settings, LogOut, Briefcase } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/components/providers/language-provider';
import { SettingsModal } from '@/components/mypage/SettingsModal';
import { ResumeManagementModal } from '@/components/resume/ResumeManagementModal';
import { MarqueeText } from '@/components/ui/marquee-text';
import { userSettingsAction } from '@/lib/actions';

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

    useEffect(() => {
        fetchProfile();
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
            <div className="h-full bg-white rounded-2xl border p-4 sm:p-5 flex flex-col shadow-sm">
                
                {/* Top Section: Avatar & Welcome text (New Layout) */}
                <div className="flex items-start gap-2.5 sm:gap-4">
                    {/* 프로필 이미지 - 약간 커짐 */}
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl sm:rounded-[1rem] bg-orange-50 flex items-center justify-center text-primary shadow-inner shrink-0 overflow-hidden border border-orange-100">
                        {profileImageUrl ? (
                            <img src={profileImageUrl} alt="프로필" className="w-full h-full object-cover" />
                        ) : (
                            <User className="h-8 w-8 sm:h-10 sm:w-10 stroke-[2.5]" />
                        )}
                    </div>

                    {/* 우측 정보 & 버튼 영역 (flex-col로 상하 배치) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-start pt-0.5 gap-1 sm:gap-1.5">
                        {/* 1. 상단 인사말 및 설정 버튼 (설정 우측 정렬) */}
                        <div className="flex w-full min-w-0 items-center justify-between gap-1 sm:gap-2">
                            <div className="min-w-0 flex-1">
                                <MarqueeText className="font-black text-[13px] min-[375px]:text-[15px] sm:text-base text-gray-900 leading-tight">
                                    <span className="text-primary">{displayName}</span>님 반갑습니다!
                                </MarqueeText>
                            </div>
                            <div className="shrink-0 scale-90 sm:scale-100 origin-right">
                                <SettingsModal />
                            </div>
                        </div>

                        {/* 2. 하단 액션 버튼들 (이력서/업체 관리 좌측, 로그아웃 우측 정렬) */}
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {showResumeMenu && (
                                    <div className="lg:hidden">
                                        {/* ResumeManagementModal 내부에 하드코딩된 button을 덮어쓰기 위해 CSS 적용 */}
                                        <div className="h-9 sm:h-10 [&>button]:px-5.5 [&>button]:h-full [&>button]:justify-center [&>button]:rounded-full [&>button]:text-[13px] sm:[&>button]:text-[15px]">
                                            <ResumeManagementModal />
                                        </div>
                                    </div>
                                )}
                                {isEmployer && (
                                    <div className="lg:hidden">
                                        <Link 
                                            href="/biz" 
                                            className="h-9 sm:h-10 flex items-center justify-center gap-1.5 px-5.5 text-[13px] sm:text-[15px] font-black text-white bg-primary hover:bg-orange-600 rounded-full transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                        >
                                            <Briefcase className="w-4 h-4" />
                                            <span>업체관리</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    document.body.style.opacity = '0.5';
                                    try {
                                        document.cookie = 'foxmon_auto_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                                        document.cookie = 'foxmon_transient=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                                        await signOut({ callbackUrl: '/login' });
                                    } catch (e) {
                                        console.error(e);
                                    }
                                }}
                                className="shrink-0 flex items-center gap-1 sm:gap-1.5 font-black text-red-500 hover:text-red-700 hover:bg-red-50 px-3 h-9 sm:h-10 rounded-full transition-all active:scale-95 text-[12px] sm:text-[14px] ml-auto"
                            >
                                <LogOut className="w-4 h-4 shrink-0" />
                                <span className="hidden sm:inline">로그아웃</span>
                                <span className="sm:hidden tracking-tight">LOGOUT</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Icons - 4 핵심 기능 (스크랩, 최근 본 공고, 지원한 공고, 나를 본 업체) */}
                <div className="flex justify-around items-center pt-3 sm:pt-4 mt-3 lg:mt-auto px-1 sm:px-2">
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
                    <Link href="/mypage/applications" prefetch={false} className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-gray-50 group-hover:bg-blue-50 transition-all duration-300 text-gray-400 group-hover:text-blue-500 group-hover:scale-110 mx-auto">
                            <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">지원한 공고</span>
                    </Link>
                    <Link href="/mypage/viewers" prefetch={false} className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-gray-50 group-hover:bg-emerald-50 transition-all duration-300 text-gray-400 group-hover:text-emerald-500 group-hover:scale-110 mx-auto">
                            <Eye className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">나를 본 업체</span>
                    </Link>
                </div>
            </div>
        );
    }

    // Logged Out State
    return (
        <div className="h-full bg-white rounded-2xl border p-6 flex flex-col justify-center items-center shadow-sm text-center">
            <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight">
                {t.loginBox.loginTitle}
            </h3>

            <Link href="/login" className="w-full mb-4">
                <Button size="lg" className="w-full font-black bg-primary hover:bg-primary/90 text-sm h-12 shadow-md">
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
