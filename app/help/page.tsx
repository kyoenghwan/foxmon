'use client';

import { useState } from 'react';
import { Bell, Search, Eye, Pin } from 'lucide-react';

// 추후 QA 원자 연동 예정 — 현재 데모 데이터
const mockNotices = [
    { id: '1', category: '공지', title: '포인트 마켓 베타오픈!', author_name: '영자', created_at: '2026-03-28', view_count: 8578, is_pinned: true },
    { id: '2', category: '공지', title: '상단고정 배너 변경', author_name: '영자', created_at: '2026-03-27', view_count: 8896, is_pinned: true },
    { id: '3', category: '공지', title: '모집·채용 시 성차별적 구인광고 금지요청', author_name: '영자', created_at: '2026-03-20', view_count: 18142, is_pinned: true },
    { id: '4', category: '기타', title: '사업자번호 조회 오류 수정', author_name: '영자', created_at: '2026-03-15', view_count: 1340, is_pinned: false },
    { id: '5', category: '기타', title: '서약서 📋', author_name: '영자', created_at: '2026-03-10', view_count: 11974, is_pinned: false },
    { id: '6', category: '공지', title: '폭스몬 정식 서비스 오픈 안내', author_name: '영자', created_at: '2026-03-01', view_count: 6703, is_pinned: false },
    { id: '7', category: '기타', title: '면접쿠폰 발송 재개', author_name: '영자', created_at: '2026-02-20', view_count: 6217, is_pinned: false },
    { id: '8', category: '공지', title: '사이트 접속이 원활하지 않았습니다.', author_name: '영자', created_at: '2026-02-06', view_count: 5482, is_pinned: false },
    { id: '9', category: '기타', title: '로그인 서버이전(앱 다시 로그인)', author_name: '영자', created_at: '2026-01-10', view_count: 6412, is_pinned: false },
    { id: '10', category: '공지', title: '앱(안드로이드) 업데이트', author_name: '영자', created_at: '2025-12-14', view_count: 6752, is_pinned: false },
];

const tabs = ['전체', '공지', '기타'];

export default function NoticePage() {
    const [activeTab, setActiveTab] = useState('전체');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = mockNotices.filter(n => {
        const matchTab = activeTab === '전체' || n.category === activeTab;
        const matchSearch = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchTab && matchSearch;
    });

    // pinned 먼저, 나머지는 날짜순
    const pinned = filtered.filter(n => n.is_pinned);
    const normal = filtered.filter(n => !n.is_pinned);

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" /> 공지사항
                </h2>
            </div>

            {/* 탭 + 검색 */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 border-b border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2.5 text-[14px] font-bold border-b-2 transition-all -mb-px ${
                                activeTab === tab
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="검색..."
                        className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-[13px] w-48 outline-none focus:border-primary"
                    />
                </div>
            </div>

            {/* 총 건수 */}
            <p className="text-[13px] text-gray-500 font-medium">
                Total <strong className="text-gray-900">{filtered.length}</strong>건
            </p>

            {/* 테이블 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* 헤더 */}
                <div className="grid grid-cols-[60px_1fr_80px_100px_80px] bg-gray-50 border-b border-gray-200 text-[12px] font-black text-gray-500">
                    <div className="px-3 py-3 text-center">번호</div>
                    <div className="px-3 py-3">제목</div>
                    <div className="px-3 py-3 text-center">이름</div>
                    <div className="px-3 py-3 text-center">날짜</div>
                    <div className="px-3 py-3 text-center">조회</div>
                </div>

                {/* 고정 항목 (알림) */}
                {pinned.map((notice) => (
                    <div
                        key={notice.id}
                        className="grid grid-cols-[60px_1fr_80px_100px_80px] border-b border-gray-100 bg-orange-50/30 hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                        <div className="px-3 py-3 text-center">
                            <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded">알림</span>
                        </div>
                        <div className="px-3 py-3 text-[14px] font-bold text-gray-900 flex items-center gap-2">
                            <span className="text-yellow-500">📌</span>
                            <span className="text-primary font-black text-[12px]">{notice.category}</span>
                            {notice.title}
                        </div>
                        <div className="px-3 py-3 text-center text-[13px] text-gray-500">{notice.author_name}</div>
                        <div className="px-3 py-3 text-center text-[13px] text-gray-500">{notice.created_at}</div>
                        <div className="px-3 py-3 text-center text-[13px] text-gray-700 font-bold">{notice.view_count.toLocaleString()}</div>
                    </div>
                ))}

                {/* 일반 항목 */}
                {normal.map((notice, idx) => (
                    <div
                        key={notice.id}
                        className="grid grid-cols-[60px_1fr_80px_100px_80px] border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <div className="px-3 py-3 text-center text-[13px] text-gray-500 font-medium">{normal.length - idx}</div>
                        <div className="px-3 py-3 text-[14px] text-gray-800 flex items-center gap-2">
                            <span className="text-gray-400 text-[12px] font-bold">{notice.category}</span>
                            {notice.title}
                        </div>
                        <div className="px-3 py-3 text-center text-[13px] text-gray-500">{notice.author_name}</div>
                        <div className="px-3 py-3 text-center text-[13px] text-gray-500">{notice.created_at}</div>
                        <div className="px-3 py-3 text-center text-[13px] text-gray-700 font-bold">{notice.view_count.toLocaleString()}</div>
                    </div>
                ))}

                {filtered.length === 0 && (
                    <div className="py-16 text-center text-gray-400 text-[14px] font-medium">
                        검색 결과가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
