'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, FileText, Heart, Eye, Clock, LogIn, Mail, Settings, LogOut } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { SettingsModal } from '@/components/mypage/SettingsModal';
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
        
        return (
            <div className="h-full bg-white rounded-2xl border p-5 flex flex-col shadow-sm">
                
                {/* Top Section: Avatar & Welcome text */}
                <div className="flex items-center gap-3">
                    {/* 프로필 이미지 - 둥근 정사각형 */}
                    <div className="h-14 w-14 rounded-xl bg-orange-50 flex items-center justify-center text-primary shadow-inner shrink-0 overflow-hidden border border-orange-100">
                        {profileImageUrl ? (
                            <img src={profileImageUrl} alt="프로필" className="w-full h-full object-contain" />
                        ) : (
                            <User className="h-7 w-7 stroke-[2.5]" />
                        )}
                    </div>

                    {/* 닉네임 & 인사 - flex-1로 남은 공간 전부 사용 */}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-black text-lg text-gray-900 leading-tight truncate">
                            <span className="text-primary">{displayName}</span>님
                        </h3>
                        <p className="text-[11px] text-gray-500 font-bold tracking-tight mt-0.5">반갑습니다!</p>
                    </div>

                    {/* 회원 설정 - 톱니 아이콘만 */}
                    <SettingsModal />
                </div>

                {/* Bottom Icons - Flex spaced */}
                <div className="flex justify-around items-center pt-4 border-t border-gray-100 mt-auto px-1">
                    <Link href="/mypage/scraps" className="flex flex-col items-center gap-1.5 group">
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 group-hover:bg-orange-50 transition-all duration-300 text-gray-400 group-hover:text-primary group-hover:scale-110">
                            <Heart className="h-5 w-5 fill-current" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap">스크랩알바</span>
                    </Link>
                    <Link href="/mypage/applications" className="flex flex-col items-center gap-1.5 group">
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 group-hover:bg-blue-50 transition-all duration-300 text-gray-400 group-hover:text-blue-500 group-hover:scale-110">
                            <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap">지원현황</span>
                    </Link>
                    <Link href="/mypage/viewers" className="flex flex-col items-center gap-1.5 group">
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 group-hover:bg-emerald-50 transition-all duration-300 text-gray-400 group-hover:text-emerald-500 group-hover:scale-110">
                            <Eye className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap">나를 본 업체</span>
                    </Link>
                    <Link href="/mypage/recent" className="flex flex-col items-center gap-1.5 group">
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 group-hover:bg-indigo-50 transition-all duration-300 text-gray-400 group-hover:text-indigo-500 group-hover:scale-110">
                            <Clock className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap">최근 본 알바</span>
                    </Link>
                    <Link href="/mypage/messages" className="flex flex-col items-center gap-1.5 group">
                        <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 group-hover:bg-purple-50 transition-all duration-300 text-gray-400 group-hover:text-purple-500 group-hover:scale-110">
                            <Mail className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap">쪽지함</span>
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
