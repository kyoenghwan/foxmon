'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/src/components/auth/LoginForm';
import { AgeVerificationBox } from '@/src/components/auth/AgeVerificationBox';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ShieldAlert, Info, Lock, X } from 'lucide-react';
import { nvLog } from '@/lib/logger';

function AgeGateContent() {
    const searchParams = useSearchParams();

    const handleVerifySuccess = () => {
        nvLog('FW', 'Age Gate: 방문자 성인 인증 성공');
        document.cookie = "age_verified=true; path=/; max-age=86400; SameSite=Lax";
        window.location.href = '/';
    };

    const handleExit = () => {
        window.location.href = 'https://www.google.com';
    };

    return (
        <div className="relative min-h-screen w-full bg-[#f8f9fa] flex flex-col p-4 md:p-8 font-sans overflow-x-hidden">
            
            {/* The Login Box is Mathematically Centered! */}
            <div className="relative w-full max-w-4xl m-auto flex flex-col">
                
                {/* FOXMON Logo: Absolute positioning to perfectly float over the independently centered login frame */}
                <div className="absolute bottom-[calc(100%-5.5rem)] md:bottom-[calc(100%-7rem)] lg:bottom-[calc(100%-8.25rem)] left-0 right-0 flex justify-center z-20 animate-in fade-in slide-in-from-top-4 duration-1000 pointer-events-none px-4 md:px-0">
                    <Image 
                        src="/foxmon_log.png" 
                        alt="FOXMON" 
                        width={1600} 
                        height={400} 
                        priority
                        className="drop-shadow-2xl w-auto h-72 md:h-[25rem] lg:h-[29rem] max-w-[100vw] object-contain min-w-[200px]"
                    />
                </div>

                {/* Main Hybrid Container */}
                <div className="w-full bg-white border border-[#eee] rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-700 relative z-10">
                    {/* Fixed Close Button for Age-Gate - Inside the card, top right */}
                    <button 
                        onClick={handleExit}
                        className="absolute top-6 right-6 md:top-8 md:right-8 z-50 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95"
                        title="인증 취소 및 나가기"
                    >
                        <X className="w-7 h-7 md:w-8 md:h-8 stroke-[2.5]" />
                    </button>
                    
                    {/* Header Area - Perfectly Symmetrical Top/Bottom Padding, Always Flex-Row (19 icon strictly on left) */}
                    <div className="bg-[#fff] px-4 py-8 md:p-10 flex items-center justify-center border-b-2 border-[#d1d5db]">
                        <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 w-full max-w-2xl text-left">
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-[6px] border-[#e60012]/10 flex items-center justify-center bg-white">
                                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#e60012]">19</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 md:p-2 bg-[#e60012] rounded-lg shadow-lg text-white">
                                    <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h1 className="text-[15px] sm:text-lg md:text-xl lg:text-2xl font-bold text-[#333] tracking-tight mb-1 sm:mb-1.5 break-keep leading-snug">
                                    청소년 보호법에 의거하여 성인인증이 필요합니다.
                                </h1>
                                <p className="text-[11px] sm:text-xs md:text-[13px] lg:text-sm text-[#777] leading-tight md:leading-relaxed break-keep">
                                    이 정보내용은 청소년 유해 매체물로서 정보통신망 이용 촉진 및 정보보호 등에 관한 법률 및 청소년 보호법의 규정에 의하여 <span className="text-[#e60012] font-bold">만 19세 미만의 청소년</span>은 이용할 수 없습니다.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Split Content Area */}
                    <div className="flex flex-col lg:flex-row transition-all duration-300">
                        {/* LEFT: Member */}
                        <div className="flex-1 px-6 pb-6 md:px-8 md:pb-8 border-b-2 lg:border-b-0 lg:border-r-2 border-[#d1d5db] flex flex-col bg-white">
                            <div className="flex flex-col items-center justify-center pt-5 mb-5 md:pt-6 md:mb-6">
                                <div className="flex items-center justify-center gap-2 text-[#444]">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <Lock className="text-purple-500 w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">회원 서비스</h2>
                                </div>
                            </div>
                            <div className="w-full h-full flex flex-col items-center justify-center">
                                <LoginForm simpleStyle={true} />
                            </div>
                        </div>

                        {/* RIGHT: Non-Member */}
                        <div className="flex-1 px-6 pb-6 md:px-8 md:pb-8 flex flex-col bg-white">
                            <div className="flex flex-col items-center justify-center pt-5 mb-5 md:pt-6 md:mb-6">
                                <div className="flex items-center justify-center gap-2 text-[#444]">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Info className="text-blue-500 w-4 h-4 md:w-5 md:h-5" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">비회원 인증 입장</h2>
                                </div>
                            </div>
                            <div className="w-full flex-1 flex flex-col items-center">
                                <div className="w-full max-w-xs">
                                    <AgeVerificationBox onVerifySuccess={handleVerifySuccess} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AgeGatePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-[#ff6b6b] font-bold italic text-2xl animate-pulse">FOXMON...</div>}>
            <AgeGateContent />
        </Suspense>
    );
}
