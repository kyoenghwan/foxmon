'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getPolicy } from '@/lib/actions/policies';

type PolicyType = 'ABOUT' | 'TERMS' | 'PRIVACY' | 'YOUTH';

export function MainFooter() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const openPolicyModal = async (type: PolicyType, title: string) => {
        setIsModalOpen(true);
        setModalTitle(title);
        setIsLoading(true);
        setModalContent('');
        
        try {
            const content = await getPolicy(type);
            setModalContent(content);
        } catch (error) {
            setModalContent('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKBAuthMark = () => {
        window.open(
            'https://okbfex.kbstar.com/quics?page=C021590&cc=b034066:b035526&mHValue=d0d24f11ddc024928bfb7aa87c54d391',
            'KB_AUTHMARK',
            'height=604, width=648, status=yes, toolbar=no, menubar=no, location=no'
        );
    };

    return (
        <>
            <footer className="bg-gray-50 border-t py-12 mt-auto">
                <div className="container px-4 md:px-6 max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                        
                        {/* Left: Brand & Links */}
                        <div className="flex flex-col gap-4">
                            <img src="/logo.png" alt="FOXMON" className="h-8 opacity-40 grayscale object-contain w-fit" />
                            <div className="flex flex-wrap gap-4 text-[13px] text-gray-600 font-bold">
                                <button onClick={() => openPolicyModal('ABOUT', '회사소개')} className="hover:text-purple-600 transition-colors">회사소개</button>
                                <button onClick={() => openPolicyModal('TERMS', '이용약관')} className="hover:text-purple-600 transition-colors">이용약관</button>
                                <button onClick={() => openPolicyModal('PRIVACY', '개인정보처리방침')} className="hover:text-purple-600 transition-colors">개인정보처리방침</button>
                                <button onClick={() => openPolicyModal('YOUTH', '청소년보호정책')} className="hover:text-purple-600 transition-colors">청소년보호정책</button>
                                <Link href="/help" className="hover:text-purple-600 transition-colors">고객지원센터</Link>
                            </div>
                        </div>

                        {/* Center: Minimum Wage Info (법적 의무 고지) */}
                        <div className="flex flex-col items-start gap-2 text-gray-500">
                            <h4 className="font-extrabold text-gray-700">2026년 최저임금</h4>
                            <div className="flex items-baseline gap-1.5">
                                <p className="text-2xl font-black text-purple-900 tracking-tighter">10,320원</p>
                                <Link 
                                    href="https://www.minimumwage.go.kr" 
                                    target="_blank" 
                                    className="text-[11px] font-bold text-gray-400 hover:text-purple-600 transition-colors"
                                >
                                    더보기 &gt;
                                </Link>
                            </div>
                            <Link 
                                href="https://www.moel.go.kr/info/defaulter/defaulterList.do" 
                                target="_blank" 
                                className="text-[11px] font-bold text-gray-600 hover:text-purple-600 transition-colors mt-1 hover:underline"
                            >
                                임금체불사업주 명단 확인하기 &gt;
                            </Link>
                        </div>

                        {/* Right: CS Center */}
                        <div className="flex flex-col items-start md:items-end gap-2 text-gray-500">
                            <h4 className="font-extrabold text-gray-700">고객센터</h4>
                            <p className="text-2xl font-black text-purple-900 tracking-tighter">070-7954-6146</p>
                            <p className="text-[11px]">평일 10:00 ~ 18:00 (점심 12:30 ~ 13:30)</p>
                            <p className="text-[11px]">주말 및 공휴일 휴무</p>
                            <Link href="mailto:foxmon.support@gmail.com" className="text-[11px] hover:underline mt-1">foxmon.support@gmail.com</Link>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 my-8"></div>

                    {/* Bottom: Legal Info */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-[11px] text-gray-400 leading-relaxed font-medium">
                        <div className="flex-1">
                            <p>
                                상호명: 폭스몬 | 대표: 민경환 | 개인정보관리책임자: 민경환 <br/>
                                사업장 주소: 경기도 김포시 고촌읍 신곡로29번길 57, 가동 501호 <br/>
                                사업자등록번호: 478-47-01041 | 직업정보제공사업 신고번호: 제 J1512020260003 호 | 통신판매업신고:  <br/>
                            </p>
                            <p className="opacity-70 mt-2">
                                폭스몬은 통신판매중개자이며 통신판매의 당사자가 아닙니다. 따라서 폭스몬은 상품·거래정보 및 거래에 대하여 책임을 지지 않습니다.
                                <br/>
                                Copyright © Foxmon Inc. All rights reserved.
                            </p>
                        </div>
                        {/* KB Escrow Badge */}
                        <div className="flex flex-col items-start md:items-end gap-1">
                            <button 
                                onClick={handleKBAuthMark}
                                className="transition-all hover:scale-[1.03] active:scale-[0.98] outline-none"
                                title="KB에스크로 이체 서비스 가입사실 확인"
                            >
                                <img 
                                    src="https://img1.kbstar.com/img/escrow/escrowcmark.gif" 
                                    alt="KB에스크로이체 가입 확인" 
                                    className="h-12 w-auto object-contain"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Policy Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">{modalTitle}</h3>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-20">
                                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div 
                                    className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: modalContent }}
                                />
                            )}
                        </div>
                        
                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
