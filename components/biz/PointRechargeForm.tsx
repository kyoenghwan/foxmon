'use client';

import { useState, useEffect } from 'react';
import { requestPointRecharge } from '@/lib/actions';
import { Info } from 'lucide-react';
import Link from 'next/link';

interface PointRechargeFormProps {
    isBusinessVerified: boolean;
    defaultDepositorName: string;
}

export function PointRechargeForm({ isBusinessVerified, defaultDepositorName }: PointRechargeFormProps) {
    const [amount, setAmount] = useState('');
    const [customAmount, setCustomAmount] = useState('');
    const [depositorName, setDepositorName] = useState(defaultDepositorName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (defaultDepositorName) {
            setDepositorName(defaultDepositorName);
        }
    }, [defaultDepositorName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isBusinessVerified) {
            alert('사업자 인증이 완료된 회원만 포인트 충전을 신청할 수 있습니다.');
            return;
        }
        
        const finalAmount = amount === 'custom' ? customAmount : amount;
        
        if (!finalAmount || !depositorName.trim()) {
            alert('충전 금액과 입금자명을 모두 입력해주세요.');
            return;
        }

        const numericAmount = parseInt(finalAmount, 10);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            alert('올바른 충전 금액을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await requestPointRecharge({
                amount: numericAmount,
                depositor_name: depositorName
            });

            if (res.success) {
                alert('충전 신청이 완료되었습니다.\n담당자 확인 후 1영업일 이내 포인트가 지급됩니다.');
                setAmount('');
                setCustomAmount('');
            } else {
                alert(`신청 실패: ${res.message}`);
            }
        } catch (error) {
            console.error('충전 신청 에러:', error);
            alert('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* 무통장 입금 안내 가이드 (계좌 직접 노출 대신 고객센터 문의 유도) */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold text-[14px] text-blue-800">무통장 입금 방식 안내</p>
                    <p className="text-[13px] text-blue-700 mt-1 leading-relaxed">
                        보안 및 미인증 입금 방지를 위해 입금 계좌는 고객센터 1:1 문의를 통해 개별 안내해 드립니다.<br />
                        아래 버튼을 눌러 입금 계좌를 안내받으신 후 신청서를 제출해 주세요.<br />
                        영업일 기준 <strong>1일 이내</strong>에 담당자가 확인 후 포인트를 지급해드립니다.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Link 
                            href="/help/inquiry" 
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[12px] font-bold rounded-lg shadow-sm transition-all"
                        >
                            ✉️ 1:1 계좌 문의하기
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                // 여우토크 CS 채팅방 열기 커스텀 이벤트 발행 (foxtalk-widget.tsx에서 감지)
                                if (typeof window !== 'undefined') {
                                    const event = new CustomEvent('open-foxtalk-cs');
                                    window.dispatchEvent(event);
                                }
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-blue-200 active:scale-95 text-blue-700 text-[12px] font-bold rounded-lg shadow-sm transition-all"
                        >
                            💬 여우토크 실시간 문의
                        </button>
                    </div>
                </div>
            </div>

            {/* 충전 신청서 폼 */}
            <div className="relative">
                {/* 사업자 미인증 시 차단 레이어 */}
                {!isBusinessVerified && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-30 flex flex-col items-center justify-center text-center p-6 rounded-xl border border-gray-100 shadow-inner">
                        <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3">
                            ⚠️
                        </div>
                        <h4 className="text-[15px] font-black text-gray-800">사업자 인증 대기 / 미인증 회원</h4>
                        <p className="text-[12px] text-gray-500 mt-1 max-w-[280px] leading-relaxed">
                            포인트 충전 신청은 사업자 번호가 검증된 사장님 회원만 이용 가능합니다. 마이페이지에서 먼저 인증을 진행해 주세요.
                        </p>
                        <Link 
                            href="/mypage" 
                            className="mt-4 px-5 py-2 bg-primary hover:bg-orange-600 text-white font-bold text-[12px] rounded-lg active:scale-95 transition-all shadow-md"
                        >
                            마이페이지로 이동
                        </Link>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={`space-y-4 ${!isBusinessVerified ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">충전 금액 (원)</label>
                            <select 
                                value={amount}
                                onChange={(e) => {
                                    setAmount(e.target.value);
                                    if (e.target.value !== 'custom') {
                                        setCustomAmount('');
                                    }
                                }}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary font-medium"
                            >
                                <option value="">금액 선택</option>
                                <option value="100000">100,000원 (100,000P)</option>
                                <option value="300000">300,000원 (300,000P + 보너스 15,000P)</option>
                                <option value="500000">500,000원 (500,000P + 보너스 50,000P)</option>
                                <option value="1000000">1,000,000원 (1,000,000P + 보너스 150,000P)</option>
                                <option value="custom">직접 입력</option>
                            </select>
                            
                            {amount === 'custom' && (
                                <div className="mt-3">
                                    <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">충전 금액 직접 입력 (원)</label>
                                    <input
                                        type="number"
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary font-medium"
                                        placeholder="충전하실 금액을 입력해주세요 (예: 150000)"
                                        min="1"
                                    />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-[12px] font-bold text-gray-600 block">입금자명</label>
                                <span className="text-[10px] font-bold text-red-500">본인 실명 입금 필수 (수정 불가)</span>
                            </div>
                            <input
                                type="text"
                                value={depositorName}
                                readOnly
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none bg-gray-100 text-gray-500 font-bold select-none"
                                placeholder="가입자 실명이 자동 입력됩니다"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-md disabled:bg-gray-300"
                    >
                        {isSubmitting ? '신청 중...' : '충전 신청하기'}
                    </button>
                </form>
            </div>
        </div>
    );
}
