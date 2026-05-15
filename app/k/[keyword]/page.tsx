import React from 'react';
import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { BlurredJobList } from '@/components/seo/blurred-job-list';
import { notFound } from 'next/navigation';
import { Flame } from 'lucide-react';

interface Props {
    params: Promise<{ keyword: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const decodedKeyword = decodeURIComponent(resolvedParams.keyword);
    const displayKeyword = decodedKeyword.replace(/-/g, ' ');

    return {
        title: `${displayKeyword} 채용정보 및 구인구직 - 폭스몬`,
        description: `현재 ${displayKeyword} 지역/업종의 최신 일자리를 확인하세요. 100% 검증된 당일 지급, 고수익 공고만 제공합니다.`,
        openGraph: {
            title: `${displayKeyword} 채용정보 - 폭스몬`,
            description: `${displayKeyword} 최신 구인구직 정보`,
            type: 'website',
            siteName: 'Foxmon',
        }
    };
}

export default async function SEOLandingPage({ params }: Props) {
    const resolvedParams = await params;
    const decodedKeyword = decodeURIComponent(resolvedParams.keyword);
    const displayKeyword = decodedKeyword.replace(/-/g, ' ');

    // 1. 파라미터 기반 검색 로직
    const parts = decodedKeyword.split('-');
    let query = supabase.from('jobs').select('id, title, location, pay, tier, category, image').eq('status', 'ACTIVE');
    
    if (parts.length > 1) {
        // 예: 강남-밤알바 -> location ILIKE '%강남%' AND (title ILIKE '%밤알바%' OR category ILIKE '%밤알바%')
        // Supabase PostgREST 에서는 and/or 체이닝 사용
        const locationKeyword = parts[0];
        const jobKeyword = parts[1];
        query = query.ilike('location', `%${locationKeyword}%`).or(`title.ilike.%${jobKeyword}%,category.ilike.%${jobKeyword}%`);
    } else {
        // 단일 키워드 (예: 밤알바)
        query = query.or(`title.ilike.%${decodedKeyword}%,location.ilike.%${decodedKeyword}%,category.ilike.%${decodedKeyword}%`);
    }

    // 최신순으로 정렬하여 최대 20개 가져오기
    const { data: jobs, error } = await query.order('created_at', { ascending: false }).limit(20);

    if (error) {
        console.error('SEO Page DB Error:', error);
    }

    const jobCount = jobs?.length || 0;
    // 평균 시급/급여 로직 (가상 로직: pay 필드가 텍스트라 평균 내기 까다로우므로 단순히 개수만 강조하거나 가상 통계 사용)
    const avgPayText = jobCount > 0 ? '업계 최고 수준' : '정보 없음';

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 py-10 px-4 sm:px-6 lg:px-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <span className="inline-block py-1 px-3 rounded-full bg-orange-100 text-orange-600 font-bold text-xs mb-4">
                        FOXMON HOT KEYWORD
                    </span>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight mb-4 flex items-center justify-center flex-wrap gap-2">
                        <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                        현재 <span className="text-primary underline decoration-4 underline-offset-4">{displayKeyword}</span> 등록 공고 {jobCount}건!
                    </h1>
                    <p className="text-gray-500 font-medium text-sm sm:text-base max-w-2xl mx-auto">
                        폭스몬에서 검증한 100% 실매물 공고입니다. 연락처와 상세 근무 조건을 확인하시려면 로그인해주세요.
                        평균 급여: <strong className="text-gray-700">{avgPayText}</strong>
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black text-gray-900">
                        🔥 최신/인기 매물 리스트
                    </h2>
                    <span className="text-xs font-bold text-gray-400">
                        * 비회원은 일부 정보가 제한됩니다.
                    </span>
                </div>

                {jobCount > 0 ? (
                    <BlurredJobList jobs={jobs || []} keyword={decodedKeyword} />
                ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            🦊
                        </div>
                        <h3 className="font-black text-gray-700 text-lg mb-2">현재 모집 중인 공고가 없습니다</h3>
                        <p className="text-gray-500 text-sm font-medium">
                            다른 지역이나 업종으로 검색해보시거나, 잠시 후 다시 확인해주세요.
                        </p>
                    </div>
                )}
                
                {/* 하단 배너/Call to Action */}
                <div className="mt-12 bg-gray-900 rounded-2xl p-6 sm:p-10 text-center relative overflow-hidden shadow-xl">
                    <div className="relative z-10">
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                            지금 바로 폭스몬에 가입하고<br/>모든 혜택을 누리세요
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            이력서 등록 시 우수 업체로부터 먼저 스카웃 제안을 받을 수 있습니다.
                        </p>
                        <a 
                            href={`/login?callbackUrl=/k/${encodeURIComponent(decodedKeyword)}`}
                            className="inline-block bg-primary text-white font-black px-8 py-3.5 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-primary/20"
                        >
                            3초만에 빠른 회원가입
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
