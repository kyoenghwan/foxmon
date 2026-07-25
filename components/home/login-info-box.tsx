'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { User, FileText, Heart, Eye, Clock, LogIn, Mail, Settings, LogOut, Briefcase, MessageCircle, ChevronDown, Gamepad2, Coins } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/components/providers/language-provider';
import { SettingsModal } from '@/components/mypage/SettingsModal';
import { ResumeManagementModal } from '@/components/resume/ResumeManagementModal';
import { MarqueeText } from '@/components/ui/marquee-text';
import { userSettingsAction } from '@/lib/actions';
import { supabase } from '@/lib/supabase';
import { QA_GET_TOTAL_UNREAD_CHAT_COUNT } from '@/src/atoms/qa/foxtalk/QA_GET_TOTAL_UNREAD_CHAT_COUNT';

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
    const [freeGamesCount, setFreeGamesCount] = useState(0);
    const [isOpen, setIsOpen] = useState(true);
    const [guestUser, setGuestUser] = useState<{ tempId: string } | null>(null);

    // 성인인증된 게스트 정보가 있는지 체크하여 임시 아이디 발급
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const verified = sessionStorage.getItem('foxmon_verified_user');
            if (verified) {
                try {
                    const data = JSON.parse(verified);
                    // 임시 아이디용 랜덤 4자리 번호 (세션 동안 고정 유지)
                    let tempNum = sessionStorage.getItem('foxmon_temp_rand');
                    if (!tempNum) {
                        tempNum = Math.floor(1000 + Math.random() * 9000).toString();
                        sessionStorage.setItem('foxmon_temp_rand', tempNum);
                    }
                    setGuestUser({ tempId: `user-${tempNum}` });
                } catch (e) {
                    console.error('Failed to parse guest user session data:', e);
                }
            } else {
                setGuestUser(null);
            }
        }
    }, [session]);

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
        if (!userId) return;

        const res = await QA_GET_TOTAL_UNREAD_CHAT_COUNT(userId);
        if (res.success && res.data !== undefined) {
            setUnreadCount(res.data);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [session?.user?.id]);

    // 실시간 안읽은 카운트 감지 채널 구독 최적화
    useEffect(() => {
        const userId = session?.user?.id;
        if (!userId) return;

        fetchUnreadCount();

        // 1. 로컬 브라우저 이벤트 리스너 등록 (동일 브라우저 내 0ms 동기화)
        const handleLocalUnreadChange = () => {
            fetchUnreadCount();
        };
        window.addEventListener('foxtalk_unread_changed', handleLocalUnreadChange);

        // 2. Supabase Realtime 채널 설정 (타 유저로부터의 실시간 수신 감지)
        let channel: any = null;

        const initRealtime = async () => {
            const normalizedUserId = userId.toLowerCase().trim();
            
            channel = supabase.channel(`unread-count-box:${normalizedUserId}`)
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
                    table: 'foxtalk_participants'
                }, () => {
                    fetchUnreadCount();
                })
                .subscribe();
        };

        initRealtime();

        return () => {
            window.removeEventListener('foxtalk_unread_changed', handleLocalUnreadChange);
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [session?.user?.id]);

    // 설정 모달에서 저장 시 즉시 프로필 이미지 갱신
    useEffect(() => {
        const handleProfileUpdate = () => fetchProfile();
        window.addEventListener('profile-updated', handleProfileUpdate);
        return () => window.removeEventListener('profile-updated', handleProfileUpdate);
    }, [session?.user?.id]);

    const fetchGameStatus = async () => {
        const userId = session?.user?.id;
        if (!userId) return;
        try {
            const res = await fetch('/api/game/status');
            const data = await res.json();
            if (data.success && data.dailyStatus) {
                let freeCount = 0;
                if (!data.dailyStatus.roulettePlayed) freeCount++;
                if (!data.dailyStatus.luckyBoxPlayed) freeCount++;
                if (!data.dailyStatus.retroPlayed) freeCount++;
                if (!data.dailyStatus.attendancePlayed) freeCount++;
                setFreeGamesCount(freeCount);
            }
        } catch (e) {
            console.error('Failed to fetch game status:', e);
        }
    };

    useEffect(() => {
        const userId = session?.user?.id;
        if (!userId) {
            setFreeGamesCount(0);
            return;
        }

        fetchGameStatus();

        const handlePlayModalClose = () => {
            fetchGameStatus();
        };

        window.addEventListener('play-modal-closed', handlePlayModalClose);
        return () => {
            window.removeEventListener('play-modal-closed', handlePlayModalClose);
        };
    }, [session?.user?.id]);

    // 비회원 성인인증 완료 게스트 상태
    if (!session?.user && guestUser) {
        return (
            <div className="h-full w-full bg-white rounded-2xl border p-5 sm:p-6 flex flex-col justify-between shadow-sm text-center">
                <div className="w-full flex flex-col items-center my-auto">
                    <h3 className="font-black text-base sm:text-lg text-gray-900 leading-tight mb-1">
                        <span className="text-primary">{guestUser.tempId}</span>님 반갑습니다!
                    </h3>
                    <p className="text-[11px] text-gray-400 font-semibold mb-4">
                        임시 아이디로 둘러보는 중입니다.
                    </p>
                </div>

                <div className="w-full space-y-3 mt-auto">
                    <Link href="/login" className="w-full block">
                        <Button size="lg" className="w-full font-black bg-primary hover:bg-primary/90 text-sm h-10 shadow-md">
                            <LogIn className="w-4 h-4 mr-2" /> 정식 로그인하기
                        </Button>
                    </Link>

                    <div className="flex justify-center gap-6 text-xs text-gray-400 font-bold">
                        <Link href="/login?tab=register" className="hover:text-primary transition-colors hover:underline underline-offset-4">{t.common.signup}</Link>
                        <Link href="/find-account" className="hover:text-primary transition-colors hover:underline underline-offset-4">{t.loginBox.findAccount}</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (session && session.user) {
        // Logged In State
        const displayName = (session.user as any).nickname || session.user.name || (session.user.email ? session.user.email.split('@')[0] : '회원');
        const userRole = (session.user as any).role;
        const isEmployer = userRole === 'EMPLOYER' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        const showResumeMenu = userRole !== 'EMPLOYER' && userRole !== 'VIEWER';
        
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
                        {/* 1. min-[800px] 이상 (우측 배치 - PC) 레이아웃 */}
                        <div className="hidden min-[800px]:flex flex-col gap-1.5">
                            {/* 상단 인사말 */}
                            <div className="min-w-0">
                                <MarqueeText className="font-black text-base text-gray-900 leading-tight text-left">
                                    <span className="text-primary">{displayName}</span>님 반갑습니다!
                                </MarqueeText>
                            </div>
                            {/* 프로필 설정 버튼 */}
                            {session.user.role !== 'VIEWER' && (
                                <div className="scale-100 origin-left shrink-0">
                                    <SettingsModal />
                                </div>
                            )}
                        </div>

                        {/* 2. min-[800px] 미만 (아래쪽 배치 - 모바일) 레이아웃 */}
                        <div className="flex min-[800px]:hidden flex-col gap-2 w-full">
                            {/* 1행: 인사말 + 프로필 설정 */}
                            <div className="flex items-center justify-between w-full gap-2">
                                <div className="min-w-0 flex-1">
                                    <MarqueeText className="font-black text-[13px] min-[375px]:text-[15px] sm:text-base text-gray-900 leading-tight text-left">
                                        <span className="text-primary">{displayName}</span>님 반갑습니다!
                                    </MarqueeText>
                                </div>
                                {session.user.role !== 'VIEWER' && (
                                    <div className="scale-90 min-[375px]:scale-95 origin-right shrink-0">
                                        <SettingsModal />
                                    </div>
                                )}
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

                {/* Bottom Icons - 3 핵심 기능 (PC에서는 항상 열림 적용) */}
                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pt-3 sm:pt-4 mt-3 lg:mt-auto' : 'grid-rows-[0fr] opacity-0 overflow-hidden min-[800px]:grid-rows-[1fr] min-[800px]:opacity-100 min-[800px]:pt-4 min-[800px]:mt-auto min-[800px]:overflow-visible'}`}>
                    <div className="overflow-hidden flex justify-around items-center px-2">
                        {isEmployer ? (
                            <Link href="/biz/points" prefetch={false} className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1">
                                <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-all duration-300 group-hover:scale-110 mx-auto">
                                    <Coins className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">포인트</span>
                            </Link>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.dispatchEvent(new CustomEvent('open_point_modal'));
                                }}
                                className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1 bg-transparent border-0 p-0 cursor-pointer"
                            >
                                <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-all duration-300 group-hover:scale-110 mx-auto">
                                    <Coins className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">포인트</span>
                            </button>
                        )}
                        
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                window.dispatchEvent(new CustomEvent('open_foxtalk'));
                            }}
                            className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1 relative bg-transparent border-0 p-0 cursor-pointer"
                        >
                            <div className={`h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 group-hover:scale-110 mx-auto relative ${
                                unreadCount > 0 
                                    ? 'bg-orange-50 text-primary group-hover:bg-orange-100/80' 
                                    : 'bg-gray-50 text-gray-400 group-hover:bg-orange-50 group-hover:text-primary'
                            }`}>
                                <MessageCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -bottom-1 -right-1 flex h-4 sm:h-4.5 min-w-[16px] sm:min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] sm:text-[9px] font-black text-white border-2 border-white shadow-sm">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">폭스토크</span>
                        </button>
                        
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open_play_modal'))}
                            className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1 bg-transparent border-0 p-0 cursor-pointer"
                        >
                            <div className={`h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl transition-all duration-300 group-hover:scale-110 mx-auto relative ${
                                freeGamesCount > 0 
                                    ? 'bg-pink-50 text-pink-500 group-hover:bg-pink-100/80' 
                                    : 'bg-gray-50 text-gray-400 group-hover:bg-pink-50 group-hover:text-pink-500'
                            }`}>
                                <Gamepad2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                                {freeGamesCount > 0 && (
                                    <span className="absolute -bottom-1 -right-1 flex h-4 sm:h-4.5 min-w-[16px] sm:min-w-[18px] items-center justify-center rounded-full bg-pink-500 px-1 text-[8px] sm:text-[9px] font-black text-white border-2 border-white shadow-sm animate-pulse">
                                        {freeGamesCount}
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">놀이터</span>
                        </button>
                        
                        <Link 
                            href="/mypage/activity"
                            prefetch={false}
                            className="flex flex-col items-center gap-1 sm:gap-1.5 group flex-1 cursor-pointer"
                        >
                            <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl sm:rounded-2xl bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-all duration-300 group-hover:scale-110 mx-auto">
                                <FileText className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 group-hover:text-gray-900 transition-colors whitespace-nowrap text-center mt-1">내 활동</span>
                        </Link>
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
                <Link href="/find-account" className="hover:text-primary transition-colors hover:underline underline-offset-4">{t.loginBox.findAccount}</Link>
            </div>
        </div>
    );
}
