'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileBlockNoticeProps {
    title?: string;
    description?: string;
}

export function MobileBlockNotice({ 
    title = '광고 등록·수정은 PC에서만 가능합니다', 
    description = '폭스몬의 정밀한 테마 템플릿 배너 편집 및 등록 기능은 PC 화면에 최적화되어 있습니다. 더욱 완벽하고 효과적인 광고 제작을 위해 PC 브라우저에서 접속해 주시기 바랍니다.'
}: MobileBlockNoticeProps) {
    const router = useRouter();

    return (
        <div className="md:hidden flex flex-col items-center justify-center min-h-[70vh] px-6 py-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-100/50 animate-pulse">
                <Monitor className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-lg font-black text-gray-900 leading-tight">
                {title}
            </h3>
            
            <p className="text-[13px] text-gray-500 font-medium mt-3.5 leading-relaxed max-w-[280px]">
                {description}
            </p>
            
            <div className="flex flex-col gap-2.5 w-full max-w-[240px] mt-8">
                <Button 
                    onClick={() => router.back()} 
                    className="w-full flex items-center justify-center gap-2 bg-[#1A1F2C] hover:bg-black text-white font-bold h-11 rounded-xl shadow-sm transition-all active:scale-95 text-[13px]"
                >
                    <ArrowLeft className="w-4 h-4" /> 이전 페이지로 이동
                </Button>
                <Button 
                    variant="outline"
                    onClick={() => router.push('/biz')} 
                    className="w-full flex items-center justify-center gap-2 border-gray-200 text-gray-600 font-bold h-11 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all text-[13px]"
                >
                    <Home className="w-4 h-4" /> 업체관리 홈으로
                </Button>
            </div>
        </div>
    );
}
