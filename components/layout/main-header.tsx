'use client';

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Globe, Search, Menu, FileText, Briefcase, LogOut, ShieldCheck, User, X, ChevronRight } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useLanguage } from '@/components/providers/language-provider';
import { ResumeManagementModal } from '@/components/resume/ResumeManagementModal';
import { cn } from '@/lib/utils';
import {
  getStayLoggedIn,
  setStayLoggedIn as persistStayLoggedIn,
  STAY_LOGGED_IN_CHANGED_EVENT,
  STAY_LOGGED_IN_STORAGE_KEY,
} from '@/lib/stay-logged-in';
import { QA_GET_POPULAR_KEYWORDS } from '@/src/atoms/qa/search/QA_GET_POPULAR_KEYWORDS';
import { FA_RECORD_SEARCH_KEYWORD_FLOW } from '@/src/atoms/fa/search/FA_RECORD_SEARCH_KEYWORD_FLOW';
import type { SearchKeyword } from '@/src/atoms/da/search/DA_SEARCH_KEYWORD_TYPES';

// Define a type that matches the session structure we expect
interface SessionUser {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
}

interface MainHeaderProps {
    session: { user?: SessionUser } | null;
}

export function MainHeader({ session }: MainHeaderProps) {
    const { language, setLanguage, t } = useLanguage();
    const pathname = usePathname() ?? '';
    const router = useRouter();
    const [showMegaMenu, setShowMegaMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
    const [stayLoggedIn, setStayLoggedIn] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // 검색어 및 실시간 인기 검색어 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [popularKeywords, setPopularKeywords] = useState<SearchKeyword[]>([]);
    const [currentRankIndex, setCurrentRankIndex] = useState(0);
    const [showRankDropdown, setShowRankDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        setStayLoggedIn(getStayLoggedIn());
    }, []);

    useEffect(() => {
        const sync = () => setStayLoggedIn(getStayLoggedIn());
        const onStorage = (e: StorageEvent) => {
            if (e.key === STAY_LOGGED_IN_STORAGE_KEY || e.key === null) sync();
        };
        window.addEventListener(STAY_LOGGED_IN_CHANGED_EVENT, sync);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener(STAY_LOGGED_IN_CHANGED_EVENT, sync);
            window.removeEventListener('storage', onStorage);
        };
    }, []);

    // 실시간 인기 검색어 주기적 로딩
    useEffect(() => {
        const fetchKeywords = async () => {
            const res = await QA_GET_POPULAR_KEYWORDS();
            if (res.success && res.data) {
                setPopularKeywords(res.data);
            }
        };
        fetchKeywords();
        const interval = setInterval(fetchKeywords, 30000); // 30초마다 갱신
        return () => clearInterval(interval);
    }, []);

    // 인기 검색어 자동 롤링 타이머 (3초)
    useEffect(() => {
        if (popularKeywords.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentRankIndex((prev) => (prev + 1) % popularKeywords.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [popularKeywords]);

    // 드롭다운 외부 클릭 감지 이벤트
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowRankDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 검색 실행 및 DB 카운터 증가 핸들러
    const handleSearch = (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        FA_RECORD_SEARCH_KEYWORD_FLOW(trimmed).catch(console.error);
        const targetPath = pathname.startsWith('/seekers') || pathname.startsWith('/seeker') ? '/seekers' : '/jobs';
        router.push(`${targetPath}?q=${encodeURIComponent(trimmed)}`);
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShowMegaMenu(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowMegaMenu(false);
        }, 150);
    };

    const toggleLang = () => {
        setLanguage(language === 'KO' ? 'EN' : 'KO');
    };

    const isEmployer = session?.user?.role === 'EMPLOYER' || session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
    const showResumeMenu = session?.user?.role !== 'EMPLOYER';
    const isBusinessVerified = (session?.user as any)?.business_number ? true : false;
    /** 홈·구인 등은 프로필 카드에 로그아웃이 있음. `/biz`, `/help`만 헤더에 유지 */
    const showLogoutInHeader =
        !!session && (pathname.startsWith('/biz') || pathname.startsWith('/help'));

    // 요청하신 순서대로 메뉴 재배치
    const menuItems = [
        { href: '/', label: "홈" },
        { href: '/jobs', label: "구인정보" },
        { href: '/seekers', label: "인재정보" },
        { href: '/community', label: "커뮤니티" },
        { href: '/help', label: "고객센터" },
    ];

    return (
        <header className="bg-white border-b sticky top-0 z-50 relative">
            {/* 상단 툴바 (Top Utility Bar) */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="container mx-auto px-4 lg:px-8 h-9 flex items-center justify-between text-[11px] sm:text-xs font-bold text-gray-500 overflow-x-auto scrollbar-hide whitespace-nowrap">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <button onClick={() => alert('💻 PC: [Ctrl + D] (Mac은 Cmd + D)를 누르시면 즐겨찾기에 등록됩니다!')} className="hover:text-primary transition-colors flex items-center gap-1 shrink-0">
                            ⭐️ 즐겨찾기
                        </button>
                        <span className="text-gray-300 shrink-0">|</span>
                        <button onClick={() => alert('📱 아이폰: Safari 하단의 [공유] 아이콘을 누르고 [홈 화면에 추가]를 선택하세요.\n🤖 안드로이드: 브라우저 메뉴에서 [홈 화면에 추가]를 선택하세요.')} className="hover:text-primary transition-colors flex items-center gap-1 shrink-0">
                            📱 <span className="hidden sm:inline">폰에 앱 설치</span><span className="sm:hidden">앱 설치</span>
                        </button>
                        <span className="text-gray-300 shrink-0">|</span>
                        <Link href="/help" className="hover:text-primary transition-colors shrink-0">공지사항</Link>
                    </div>
                    {session ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-2">
                            <span className="text-[10px] sm:text-[11px] font-bold text-gray-600 whitespace-nowrap">
                                로그인 유지
                            </span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={stayLoggedIn}
                                aria-label="로그인 유지"
                                title="켜면 무동작 시 자동 로그아웃이 적용되지 않습니다."
                                onClick={() => {
                                    const next = !stayLoggedIn;
                                    setStayLoggedIn(next);
                                    persistStayLoggedIn(next);
                                }}
                                className={cn(
                                    'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                                    stayLoggedIn ? 'border-primary bg-primary' : 'border-gray-300 bg-gray-200'
                                )}
                            >
                                <span
                                    className={cn(
                                        'pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ease-out',
                                        stayLoggedIn ? 'translate-x-4' : 'translate-x-0.5'
                                    )}
                                />
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* 1단: 로고(좌) · 검색창 & 키워드(세로 스택) · 회원정보/로그인(우) */}
            <div className="container mx-auto px-4 lg:px-8 py-3 md:py-4">
                <div className="flex flex-row items-center justify-between gap-3 md:gap-6 w-full">
                    {/* 좌측: 로고 */}
                    <div className="flex items-center shrink-0">
                        <Link href="/" className="group flex items-center">
                            <img
                                src="/logo.png"
                                alt="FOXMON"
                                className="h-9 sm:h-11 md:h-14 w-auto drop-shadow-sm hover:scale-105 transition-transform"
                            />
                        </Link>
                    </div>

                    {/* 중앙: 검색 영역 & 키워드 영역 (세로 스택) */}
                    <div className="flex-1 max-w-2xl flex flex-col gap-1.5 justify-center">
                        {/* 1. 검색창 */}
                        <div className="relative group w-full">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch(searchQuery);
                                    }
                                }}
                                placeholder={t.common.searchPlaceholder || "어떤 알바를 찾으세요?"}
                                className="block w-full pl-9 pr-9 py-1.5 md:py-2 border-2 border-primary/20 rounded-full bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary focus:ring-0 outline-none transition-all text-[13px] md:text-sm font-bold shadow-sm"
                            />
                            <button
                                onClick={() => handleSearch(searchQuery)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-primary transition-colors"
                            >
                                <Search className="h-4 w-4" />
                            </button>
                        </div>

                        {/* 2. 키워드 롤링 & 드롭다운 */}
                        <div className="flex items-center gap-4 px-2 text-[12px] font-bold text-gray-500 w-full relative z-30">
                            <span className="text-primary text-[11px] shrink-0">키워드</span>
                            
                            {/* 롤링 검색어 영역 */}
                            <div className="flex-1 overflow-hidden h-5 relative cursor-pointer" onClick={() => {
                                if (popularKeywords[currentRankIndex]) {
                                    handleSearch(popularKeywords[currentRankIndex].keyword);
                                }
                            }}>
                                {popularKeywords.length > 0 ? (
                                    popularKeywords.map((item, idx) => (
                                        <div
                                            key={item.keyword}
                                            className={cn(
                                                "absolute left-0 top-0 w-full h-full flex items-center gap-2 transition-all duration-500 ease-in-out transform",
                                                idx === currentRankIndex
                                                    ? "opacity-100 translate-y-0"
                                                    : "opacity-0 translate-y-4 pointer-events-none"
                                            )}
                                        >
                                            <span className="text-primary font-black shrink-0">{idx + 1}</span>
                                            <span className="text-gray-800 hover:text-primary transition-colors truncate">{item.keyword}</span>
                                            {idx === 0 && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.2 rounded-sm scale-90 font-black shrink-0">HOT</span>}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-400 font-medium">검색어 불러오는 중...</span>
                                )}
                            </div>

                            {/* 전체 순위 드롭다운 버튼 & 레이어 */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowRankDropdown(!showRankDropdown)}
                                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-900 transition-colors font-bold px-2 py-0.5 border border-gray-200 rounded bg-white shadow-xs"
                                >
                                    <span>보기</span>
                                    <span className={cn("text-[9px] transition-transform duration-200", showRankDropdown ? "rotate-180" : "")}>▼</span>
                                </button>

                                {/* 드롭다운 레이어 */}
                                {showRankDropdown && popularKeywords.length > 0 && (
                                    <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-3 px-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="text-[11px] font-black text-gray-400 border-b pb-1.5 mb-2 px-2 flex justify-between items-center">
                                            <span>인기 키워드</span>
                                            <span className="text-primary">조회수</span>
                                        </div>
                                        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto scrollbar-thin">
                                            {popularKeywords.map((item, idx) => (
                                                <button
                                                    key={item.keyword}
                                                    onClick={() => {
                                                        handleSearch(item.keyword);
                                                        setShowRankDropdown(false);
                                                    }}
                                                    className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded-lg hover:bg-primary/5 transition-all text-xs font-bold text-gray-700"
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <span className={cn(
                                                            "text-[10px] w-4 h-4 flex items-center justify-center rounded-sm font-black shrink-0",
                                                            idx < 3 ? "bg-primary/10 text-primary" : "text-gray-400"
                                                        )}>
                                                            {idx + 1}
                                                        </span>
                                                        <span className="truncate hover:text-primary transition-colors">{item.keyword}</span>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-gray-400">
                                                        {item.clicks_count.toLocaleString()}회
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 우측: 회원정보 / 로그인 버튼 (데스크톱에서만 노출) */}
                    <div className="hidden md:flex items-center gap-3 shrink-0 text-[12px] sm:text-[13px] font-bold text-gray-500">
                        {session ? (
                            <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1.5 text-[11px] sm:text-[13px] font-bold text-gray-600">
                                    <span className={`shrink-0 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-black text-white ${
                                        session.user?.role === 'SUPER_ADMIN' ? 'bg-red-500' :
                                        session.user?.role === 'ADMIN' ? 'bg-purple-600' :
                                        session.user?.role === 'EMPLOYER' ? 'bg-primary' : 'bg-blue-500'
                                    }`}>
                                        {session.user?.role === 'SUPER_ADMIN' ? 'S' :
                                         session.user?.role === 'ADMIN' ? 'A' :
                                         session.user?.role === 'EMPLOYER' ? 'B' : 'U'}
                                    </span>
                                    <span className="text-primary font-black ml-0.5 hidden sm:inline truncate">
                                        {session.user?.role === 'SUPER_ADMIN' ? '최고 관리자' :
                                         session.user?.role === 'ADMIN' ? '일반 관리자' :
                                         session.user?.role === 'EMPLOYER' ? '업체회원' : '개인회원'}
                                    </span>
                                </span>
                                {(session.user?.role === 'ADMIN' || session.user?.role === 'SUPER_ADMIN') && (
                                    <>
                                        <span className="text-gray-300 shrink-0">|</span>
                                        <Link href="/fox-office" className="hover:text-primary transition-colors text-[12px] shrink-0">관리자홈</Link>
                                    </>
                                )}
                                <span className="text-gray-300 shrink-0">|</span>
                                <button
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
                                    className="font-black text-red-500 hover:text-red-700 transition-colors whitespace-nowrap shrink-0"
                                >
                                    로그아웃
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5 whitespace-nowrap">
                                <Link href="/login" className="hover:text-gray-900 transition-colors">로그인</Link>
                                <span className="text-gray-300">|</span>
                                <Link href="/signup" className="hover:text-gray-900 transition-colors">회원가입</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2단: 네비게이션 메뉴 바 */}
            <div className="border-t border-gray-100 bg-white">
                <div className="container mx-auto px-4 lg:px-8">
                    <nav className="flex items-center justify-between min-h-[3.5rem] lg:h-14 py-1.5 lg:py-0 relative w-full">
                        <div className="flex items-center gap-4 sm:gap-6 md:gap-8 h-full w-full min-w-0">
                            {/* 햄버거 메뉴 (전체) */}
                            <div 
                                className="h-full flex items-center pr-2 sm:pr-4 md:pr-6 md:border-r border-gray-100 cursor-pointer group"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => {
                                    if (window.innerWidth < 1024) {
                                        setShowMobileMenu(true);
                                    } else {
                                        setShowMegaMenu(!showMegaMenu);
                                    }
                                }}
                            >
                                <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800 group-hover:text-primary transition-colors md:mr-2" />
                                <span className="hidden lg:inline font-black text-[15px] sm:text-[16px] text-gray-800 group-hover:text-primary transition-colors whitespace-nowrap">전체메뉴</span>
                            </div>

                            {/* 개별 메뉴 리스트 */}
                            <div className="flex items-center justify-start gap-x-4 sm:gap-x-6 lg:gap-x-8 h-auto lg:h-full py-2 lg:py-0 flex-1 overflow-x-auto scrollbar-hide">
                                {menuItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`text-[13px] min-[360px]:text-[14px] sm:text-[15px] lg:text-[17px] xl:text-[18px] font-black border-b-2 transition-all h-auto py-1 lg:py-0 lg:h-full flex items-center whitespace-nowrap px-0.5 sm:px-1 shrink-0 ${isActive
                                                    ? 'text-primary border-primary'
                                                    : 'text-gray-900 border-transparent hover:border-primary hover:text-primary'
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 우측 끝 맞춤형 관리 메뉴 */}
                        <div className="hidden lg:flex items-center h-full py-2.5 gap-2 shrink-0">
                            {showResumeMenu && (
                                <ResumeManagementModal />
                            )}
                            {isEmployer && (
                                <Link 
                                    href="/biz" 
                                    className="h-full flex items-center gap-1.5 px-5 text-[13px] sm:text-[14px] font-black text-white bg-primary hover:bg-orange-600 rounded-full transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0"
                                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                                >
                                    <Briefcase className="w-4 h-4 shrink-0" />
                                    <span style={{ whiteSpace: 'nowrap', wordBreak: 'keep-all' }}>업체관리</span>
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            </div>

            {/* 3단: 메가 메뉴 드롭다운 (마우스 호버 시 표시, 모바일에서는 숨김) */}
            {showMegaMenu && (
                <div 
                    className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-xl z-40 animate-in fade-in slide-in-from-top-2 duration-200 hidden lg:block"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="container mx-auto px-4 lg:px-8 py-8 flex justify-between gap-4">
                        {/* Column 1 */}
                        <div className="space-y-4">
                            <h4 className="font-black text-gray-900 border-b-2 border-primary w-fit pb-1 mb-4">지역별 구인정보</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[14px] font-medium text-gray-600">
                                <Link href="#" className="hover:text-primary transition-colors">서울</Link>
                                <Link href="#" className="hover:text-primary transition-colors">경기</Link>
                                <Link href="#" className="hover:text-primary transition-colors">인천</Link>
                                <Link href="#" className="hover:text-primary transition-colors">대전</Link>
                                <Link href="#" className="hover:text-primary transition-colors">대구</Link>
                                <Link href="#" className="hover:text-primary transition-colors">부산</Link>
                                <Link href="#" className="hover:text-primary transition-colors">울산</Link>
                                <Link href="#" className="hover:text-primary transition-colors">광주</Link>
                                <Link href="#" className="hover:text-primary transition-colors">세종</Link>
                                <Link href="#" className="hover:text-primary transition-colors">제주</Link>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4">
                            <h4 className="font-black text-gray-900 border-b-2 border-primary w-fit pb-1 mb-4">업종별 구인정보</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[14px] font-medium text-gray-600">
                                <Link href="#" className="hover:text-primary transition-colors">스웨디시</Link>
                                <Link href="#" className="hover:text-primary transition-colors">1인샵</Link>
                                <Link href="#" className="hover:text-primary transition-colors">왁싱</Link>
                                <Link href="#" className="hover:text-primary transition-colors">아로마마사지</Link>
                                <Link href="#" className="hover:text-primary transition-colors">스포츠마사지</Link>
                                <Link href="#" className="hover:text-primary transition-colors">피부관리</Link>
                                <Link href="#" className="hover:text-primary transition-colors">타이마사지</Link>
                            </div>
                        </div>

                        {/* Column 3 */}
                        <div className="space-y-4">
                            <h4 className="font-black text-gray-900 border-b-2 border-primary w-fit pb-1 mb-4">지역별 인재정보</h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[14px] font-medium text-gray-600">
                                <Link href="#" className="hover:text-primary transition-colors">서울</Link>
                                <Link href="#" className="hover:text-primary transition-colors">경기</Link>
                                <Link href="#" className="hover:text-primary transition-colors">인천</Link>
                                <Link href="#" className="hover:text-primary transition-colors">대전</Link>
                                <Link href="#" className="hover:text-primary transition-colors">대구</Link>
                                <Link href="#" className="hover:text-primary transition-colors">부산</Link>
                            </div>
                        </div>

                        {/* Column 4: 커뮤니티 */}
                        <div className="space-y-4">
                            <h4 className="font-black text-gray-900 border-b-2 border-primary w-fit pb-1 mb-4">커뮤니티</h4>
                            <div className="grid grid-cols-1 gap-y-3 text-[14px] font-medium text-gray-600">
                                <Link href="/community?tab=foxtalk" className="hover:text-primary transition-colors flex items-center gap-1">
                                    폭스수다 <span className="bg-primary text-black text-[9px] px-1.5 py-0.5 rounded-full font-black">HOT</span>
                                </Link>
                                <Link href="/community?tab=foxmarket" className="hover:text-primary transition-colors">폭스중고</Link>
                                <Link href="/community?tab=business" className="hover:text-primary transition-colors">업소장터</Link>
                                <Link href="/community?tab=reviews" className="hover:text-primary transition-colors">알바후기</Link>
                                <Link href="/community?tab=secret" className="hover:text-primary transition-colors flex items-center gap-1">
                                    비밀게시판 <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">N</span>
                                </Link>
                            </div>
                        </div>

                        {/* Column 5: 고객센터 */}
                        <div className="space-y-4">
                            <h4 className="font-black text-gray-900 border-b-2 border-primary w-fit pb-1 mb-4">고객센터</h4>
                            <div className="grid grid-cols-1 gap-y-3 text-[14px] font-medium text-gray-600">
                                <Link href="#" className="hover:text-primary transition-colors">질문답변</Link>
                                <Link href="#" className="hover:text-primary transition-colors">자주묻는질문</Link>
                                <Link href="/help" className="hover:text-primary transition-colors">공지사항</Link>
                                <Link href="/jobs/post" className="hover:text-primary transition-colors flex items-center gap-1">
                                    광고상품안내 <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">HOT</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4단: 모바일 전용 풀스크린 햄버거 메뉴 */}
            {showMobileMenu && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col lg:hidden animate-in slide-in-from-right duration-300">
                    <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 bg-white">
                        <Link href="/" onClick={() => setShowMobileMenu(false)} className="font-black text-xl text-primary tracking-tight">FOXMON</Link>
                        <button onClick={() => setShowMobileMenu(false)} className="p-2 -mr-2 text-gray-500 hover:text-gray-900">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {/* 빠른 링크 */}
                        <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-50 bg-gray-50/50">
                            <Link href="/jobs" onClick={() => setShowMobileMenu(false)} className="bg-white p-3 rounded-xl border border-gray-100 text-center font-bold text-sm shadow-sm">
                                🔍 구인정보
                            </Link>
                            <Link href="/seekers" onClick={() => setShowMobileMenu(false)} className="bg-white p-3 rounded-xl border border-gray-100 text-center font-bold text-sm shadow-sm">
                                💼 인재정보
                            </Link>
                        </div>

                        {/* 모바일 아코디언 전체 메뉴 */}
                        <div className="px-4 py-2">
                            {/* 지역별 구인정보 */}
                            <div className="border-b border-gray-100">
                                <button onClick={() => setMobileExpanded(mobileExpanded === 'region' ? null : 'region')} className="w-full flex items-center justify-between py-4 font-black text-gray-900">
                                    <span>지역별 구인정보</span>
                                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${mobileExpanded === 'region' ? 'rotate-90 text-primary' : ''}`} />
                                </button>
                                {mobileExpanded === 'region' && (
                                    <div className="grid grid-cols-3 gap-3 pb-4 px-2 text-sm font-medium text-gray-600">
                                        <Link href="#" className="py-1">서울</Link><Link href="#" className="py-1">경기</Link><Link href="#" className="py-1">인천</Link>
                                        <Link href="#" className="py-1">대전</Link><Link href="#" className="py-1">대구</Link><Link href="#" className="py-1">부산</Link>
                                        <Link href="#" className="py-1">울산</Link><Link href="#" className="py-1">광주</Link><Link href="#" className="py-1">세종</Link>
                                        <Link href="#" className="py-1">제주</Link>
                                    </div>
                                )}
                            </div>

                            {/* 업종별 구인정보 */}
                            <div className="border-b border-gray-100">
                                <button onClick={() => setMobileExpanded(mobileExpanded === 'job' ? null : 'job')} className="w-full flex items-center justify-between py-4 font-black text-gray-900">
                                    <span>업종별 구인정보</span>
                                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${mobileExpanded === 'job' ? 'rotate-90 text-primary' : ''}`} />
                                </button>
                                {mobileExpanded === 'job' && (
                                    <div className="grid grid-cols-2 gap-3 pb-4 px-2 text-sm font-medium text-gray-600">
                                        <Link href="#" className="py-1">스웨디시</Link><Link href="#" className="py-1">1인샵</Link>
                                        <Link href="#" className="py-1">왁싱</Link><Link href="#" className="py-1">아로마마사지</Link>
                                        <Link href="#" className="py-1">스포츠마사지</Link><Link href="#" className="py-1">피부관리</Link>
                                        <Link href="#" className="py-1">타이마사지</Link>
                                    </div>
                                )}
                            </div>

                            {/* 커뮤니티 */}
                            <div className="border-b border-gray-100">
                                <button onClick={() => setMobileExpanded(mobileExpanded === 'community' ? null : 'community')} className="w-full flex items-center justify-between py-4 font-black text-gray-900">
                                    <span>커뮤니티</span>
                                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${mobileExpanded === 'community' ? 'rotate-90 text-primary' : ''}`} />
                                </button>
                                {mobileExpanded === 'community' && (
                                    <div className="flex flex-col gap-3 pb-4 px-2 text-sm font-medium text-gray-600">
                                        <Link href="/community?tab=foxtalk" className="flex items-center gap-2">폭스수다 <span className="bg-primary text-black text-[9px] px-1.5 py-0.5 rounded-full font-black">HOT</span></Link>
                                        <Link href="/community?tab=foxmarket">폭스중고</Link>
                                        <Link href="/community?tab=business">업소장터</Link>
                                        <Link href="/community?tab=reviews">알바후기</Link>
                                        <Link href="/community?tab=secret" className="flex items-center gap-2">비밀게시판 <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">N</span></Link>
                                    </div>
                                )}
                            </div>

                            {/* 고객센터 */}
                            <div className="border-b border-gray-100">
                                <button onClick={() => setMobileExpanded(mobileExpanded === 'help' ? null : 'help')} className="w-full flex items-center justify-between py-4 font-black text-gray-900">
                                    <span>고객센터</span>
                                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${mobileExpanded === 'help' ? 'rotate-90 text-primary' : ''}`} />
                                </button>
                                {mobileExpanded === 'help' && (
                                    <div className="flex flex-col gap-3 pb-4 px-2 text-sm font-medium text-gray-600">
                                        <Link href="#">질문답변</Link>
                                        <Link href="#">자주묻는질문</Link>
                                        <Link href="/help">공지사항</Link>
                                        <Link href="/jobs/post" className="flex items-center gap-2">광고상품안내 <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">HOT</span></Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 모바일 하단 액션 버튼 */}
                        <div className="p-4 mt-4">
                            {isEmployer ? (
                                <Link href="/biz" onClick={() => setShowMobileMenu(false)} className="w-full h-12 flex items-center justify-center gap-2 text-[14px] font-black text-white bg-primary hover:bg-orange-600 rounded-xl transition-all shadow-sm">
                                    <Briefcase className="w-4 h-4" /> 업체관리 바로가기
                                </Link>
                            ) : (
                                <Link href="/login" onClick={() => setShowMobileMenu(false)} className="w-full h-12 flex items-center justify-center gap-2 text-[14px] font-black text-primary bg-primary/10 rounded-xl transition-all shadow-sm">
                                    로그인 후 이용하기
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
