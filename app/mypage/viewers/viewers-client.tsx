'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Eye, Calendar, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface ViewerItem {
    id: string;
    companyName: string;
    location: string;
    viewedAt: Date;
    jobId: string;
}

export default function ViewersClient() {
    const [viewers, setViewers] = useState<ViewerItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 현재 날짜 기준 상대적인 실시간 열람 기록 생성
        const now = new Date();
        const mockViewers: ViewerItem[] = [
            {
                id: 'v-1',
                companyName: '골드문 스웨디시',
                location: '서울 강남구 역삼동',
                viewedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2시간 전
                jobId: 'mock-1'
            },
            {
                id: 'v-2',
                companyName: '레옹 테라피 & 왁싱',
                location: '경기 성남시 분당구',
                viewedAt: new Date(now.getTime() - 14 * 60 * 60 * 1000), // 14시간 전
                jobId: 'mock-2'
            },
            {
                id: 'v-3',
                companyName: '팰리스 가라오케',
                location: '서울 마포구 서교동',
                viewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000), // 1일 3시간 전
                jobId: 'mock-3'
            },
            {
                id: 'v-4',
                companyName: '시크릿 1인샵',
                location: '서울 서초구 반포동',
                viewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000), // 2일 5시간 전
                jobId: 'mock-4'
            },
            {
                id: 'v-5',
                companyName: '엔젤 아로마',
                location: '인천 부평구 부평동',
                viewedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4일 전
                jobId: 'mock-5'
            }
        ];

        const timer = setTimeout(() => {
            setViewers(mockViewers);
            setLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    const formatRelativeTime = (date: Date) => {
        const diffMs = new Date().getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (60 * 1000));
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        return `${diffDays}일 전`;
    };

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-medium">열람 업체를 불러오는 중...</p>
            </div>
        );
    }

    if (viewers.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 mb-3">
                    <Eye className="w-6 h-6" />
                </div>
                <p className="text-gray-900 font-bold text-[16px] mb-1">내 이력서를 열람한 업체가 없습니다.</p>
                <p className="text-gray-400 text-xs font-medium">이력서를 더 매력적으로 작성하면 조회 확률이 높아집니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/50 flex items-start gap-3 mb-4">
                <span className="text-purple-600 text-lg mt-0.5">🔔</span>
                <div className="text-xs font-bold text-purple-900 leading-relaxed">
                    사장님들이 회원님의 인재 프로필에 큰 관심을 보이고 있습니다! <br className="hidden sm:block"/>
                    아래 업체들의 상세 구인정보를 확인하거나, 대화방을 열어 직접 연락해보세요.
                </div>
            </div>

            {viewers.map((viewer) => (
                <div key={viewer.id} className="p-4 sm:p-5 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">
                                프로필 열람
                            </span>
                            <span className="text-[10px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded animate-pulse">
                                {formatRelativeTime(viewer.viewedAt)}
                            </span>
                        </div>
                        <h3 className="font-black text-gray-900 text-[16px] sm:text-[18px] tracking-tight truncate mb-1">
                            {viewer.companyName}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>{viewer.location}</span>
                        </div>
                    </div>

                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-gray-50 pt-3 sm:pt-0 shrink-0 gap-2.5">
                        <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>열람시각:</span>
                            <span className="font-bold text-gray-600">{formatDate(viewer.viewedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Link 
                                href={`/jobs/${viewer.jobId}`}
                                className="flex-1 sm:flex-initial text-center text-xs font-black text-gray-700 hover:text-gray-900 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                            >
                                공고 보기
                            </Link>
                            <Link
                                href={`/jobs/${viewer.jobId}`} // 공고 상세로 가서 FoxTalk 연결
                                className="flex-1 sm:flex-initial text-center text-xs font-black text-white px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1"
                            >
                                <MessageCircle className="w-3.5 h-3.5" />
                                톡 보내기
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
