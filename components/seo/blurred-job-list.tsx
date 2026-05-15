'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Crown, Lock, MapPin } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    location: string;
    pay: string;
    tier: string;
    category?: string;
    image?: string;
}

interface BlurredJobListProps {
    jobs: Job[];
    keyword: string;
}

export function BlurredJobList({ jobs, keyword }: BlurredJobListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [showModal, setShowModal] = useState(false);

    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowModal(true);
    };

    const handleLoginRedirect = () => {
        const callbackUrl = encodeURIComponent(pathname || `/k/${encodeURIComponent(keyword)}`);
        router.push(`/login?callbackUrl=${callbackUrl}`);
    };

    return (
        <div className="w-full relative">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                    <div 
                        key={job.id}
                        onClick={handleCardClick}
                        className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col aspect-[3/2]"
                    >
                        {/* 상단: 이미지와 라벨 */}
                        <div className="flex w-full h-[45%] gap-2 shrink-0 p-2">
                            {/* 로고 영역 */}
                            <div className="flex-1 min-w-0 bg-gray-50 flex items-center justify-center rounded-lg border border-gray-100 overflow-hidden shrink-0 relative">
                                {job.image ? (
                                    <div 
                                        className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                                        style={{ backgroundImage: `url(${job.image})` }} 
                                    />
                                ) : (
                                    <div className="text-gray-300 font-black text-[11px] w-full h-full flex items-center justify-center">NO LOGO</div>
                                )}
                            </div>
                            
                            {/* 업소명 (블러 처리) 및 지역 */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center space-y-2">
                                <div className="flex items-center gap-1 shrink-0 border px-1.5 py-[2px] font-black rounded text-[10px] bg-gray-100 text-gray-600 border-gray-200 w-fit">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{job.location.split(' ').slice(0, 2).join(' ')}</span>
                                </div>
                                <div className="relative overflow-hidden w-fit">
                                    <span className="font-black text-[15px] tracking-tight text-transparent bg-gray-300 rounded select-none blur-[4px]">
                                        비공개 업소명
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 중간: 광고글 */}
                        <div className="w-full relative overflow-hidden flex items-center gap-2 shrink-0 px-3 py-1">
                            {job.category && (
                                <span className="shrink-0 border px-1 py-[1px] rounded text-[10px] font-black bg-gray-100 text-gray-600 border-gray-200">
                                    {job.category}
                                </span>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] leading-snug font-bold tracking-tight text-gray-800 truncate">
                                    {job.title}
                                </p>
                            </div>
                        </div>

                        {/* 하단: 급여 및 자물쇠 */}
                        <div className="flex items-end justify-between w-full shrink-0 px-3 pb-3 mt-auto">
                            <div className="flex items-center text-[15px] font-black text-red-500 truncate tracking-tight gap-1.5">
                                {job.pay}
                            </div>
                            
                            {/* Paywall Lock */}
                            <div className="shrink-0 flex items-center px-2 py-1 rounded-md text-[11px] font-black shadow-sm bg-gray-900 text-white gap-1 group-hover:bg-primary transition-colors">
                                <Lock className="w-3 h-3" />
                                <span>로그인 후 확인</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Login Prompt Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Lock className="w-6 h-6 text-gray-600" />
                        </div>
                        <h3 className="font-black text-xl text-gray-900 text-center mb-2">
                            연락처 및 상세 정보 확인
                        </h3>
                        <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed font-medium">
                            가려진 업소명과 연락처를 확인하려면<br/>
                            로그인이 필요합니다.
                        </p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                닫기
                            </button>
                            <button 
                                onClick={handleLoginRedirect}
                                className="flex-1 py-3 rounded-xl text-sm font-black text-white bg-primary hover:bg-primary/90 shadow-sm transition-colors"
                            >
                                1초만에 로그인하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
