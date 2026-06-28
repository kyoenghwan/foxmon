'use client';

import { useState, useEffect } from 'react';
import { requestPointRecharge } from '@/lib/actions';
import { createInquiry } from '@/lib/actions/help';
import { Info, X, MessageSquare, Check, Copy } from 'lucide-react';
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

    // 1:1 계좌 문의 모달 관련 상태
    const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
    const [inquiryTitle, setInquiryTitle] = useState('포인트 충전용 입금 계좌 문의');
    const [inquiryContent, setInquiryContent] = useState('안녕하세요. 광고 등록을 위해 포인트를 충전하고자 합니다. 무통장 입금 계좌번호를 안내해 주세요.');
    const [isSendingInquiry, setIsSendingInquiry] = useState(false);
    const [autoReplyText, setAutoReplyText] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (defaultDepositorName) {
            setDepositorName(defaultDepositorName);
        }
    }, [defaultDepositorName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isBusinessVerified) {
            alert('사업자 또는 본인인증이 완료된 회원만 포인트 충전을 신청할 수 있습니다.');
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

    // 1:1 문의글 제출 및 자동 계좌 답변 확인
    const handleSendInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inquiryTitle.trim() || !inquiryContent.trim()) {
            alert('문의 제목과 내용을 입력해 주세요.');
            return;
        }

        setIsSendingInquiry(true);
        try {
            const res = await createInquiry({
                category: '포인트·환불',
                title: inquiryTitle,
                content: inquiryContent
            });

            if (res.success && res.inquiry) {
                // 자동 답변(reply) 존재 시 해당 답변 텍스트 바인딩
                if (res.inquiry.reply) {
                    setAutoReplyText(res.inquiry.reply);
                } else {
                    setAutoReplyText('문의가 등록되었습니다. 담당자가 순차적으로 답변을 남겨 드리겠습니다.');
                }
            } else {
                alert(res.message || '문의 등록에 실패했습니다.');
            }
        } catch (err) {
            console.error('문의 전송 오류:', err);
            alert('오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setIsSendingInquiry(false);
        }
    };

    const handleCopyAccount = (text: string) => {
        // 계좌번호 파싱 시도 (단순 복사용)
        const match = text.match(/계좌번호:\s*([^\n]+)/);
        const account = match ? match[1].trim() : text;
        navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCloseInquiryModal = () => {
        setIsInquiryModalOpen(false);
        setAutoReplyText(null);
        setInquiryTitle('포인트 충전용 입금 계좌 문의');
        setInquiryContent('안녕하세요. 광고 등록을 위해 포인트를 충전하고자 합니다. 무통장 입금 계좌번호를 안내해 주세요.');
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
                        <button 
                            type="button"
                            onClick={() => setIsInquiryModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[12px] font-bold rounded-lg shadow-sm transition-all"
                        >
                            ✉️ 1:1 계좌 문의하기
                        </button>
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
                        <h4 className="text-[15px] font-black text-gray-800">본인 / 사업자 인증 필요 회원</h4>
                        <p className="text-[12px] text-gray-500 mt-1 max-w-[280px] leading-relaxed">
                            포인트 충전 신청은 사업자 등록증 또는 신분증(주민등록증) 인증이 최종 승인 완료된 회원만 이용 가능합니다. 마이페이지에서 먼저 인증을 제출해 주세요.
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

            {/* 1:1 계좌 문의 모달 팝업 */}
            {isInquiryModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                        {/* 헤더 */}
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-black text-[16px] text-gray-900 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                {autoReplyText ? '입금 계좌 자동 답변 완료' : '1:1 계좌 문의 접수'}
                            </h3>
                            <button 
                                onClick={handleCloseInquiryModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 바디 */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {!autoReplyText ? (
                                <form onSubmit={handleSendInquiry} className="space-y-4">
                                    <div>
                                        <label className="text-[12px] font-bold text-gray-500 block mb-1">카테고리</label>
                                        <input 
                                            type="text" 
                                            value="포인트·환불 (고정)" 
                                            disabled 
                                            className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-400 font-bold rounded-lg text-[13px] outline-none cursor-not-allowed" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-gray-500 block mb-1">문의 제목</label>
                                        <input 
                                            type="text" 
                                            value={inquiryTitle} 
                                            onChange={(e) => setInquiryTitle(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-blue-500" 
                                            placeholder="제목을 입력해 주세요"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[12px] font-bold text-gray-500 block mb-1">문의 내용</label>
                                        <textarea 
                                            rows={4}
                                            value={inquiryContent} 
                                            onChange={(e) => setInquiryContent(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-blue-500 resize-none" 
                                            placeholder="문의하실 상세 내용을 적어주세요."
                                            required
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSendingInquiry}
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-[13px] rounded-xl shadow-md transition-all disabled:bg-gray-300"
                                        >
                                            {isSendingInquiry ? '문의 전송 중...' : '문의 등록하고 즉시 답변 받기'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-2.5">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-[13px] text-emerald-800">1:1 문의가 안전하게 등록되었습니다.</p>
                                            <p className="text-[12px] text-emerald-600 mt-0.5">시스템에 의해 즉시 발급된 계좌 정보입니다.</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 relative">
                                        <label className="text-[11px] font-bold text-gray-400 block mb-1.5 uppercase tracking-wider">자동 답변 내용</label>
                                        <pre className="text-[13px] text-gray-700 font-medium leading-relaxed font-sans whitespace-pre-wrap">
                                            {autoReplyText}
                                        </pre>

                                        <button
                                            onClick={() => handleCopyAccount(autoReplyText)}
                                            className="absolute top-3 right-3 p-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg transition-all active:scale-95 flex items-center gap-1 text-[11px] font-bold text-gray-600 shadow-sm"
                                            title="계좌번호 복사"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                    <span className="text-emerald-600">복사됨</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5" />
                                                    <span>계좌복사</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="pt-2 text-center">
                                        <button
                                            onClick={handleCloseInquiryModal}
                                            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white text-[13px] font-bold rounded-xl transition-all shadow-md w-full"
                                        >
                                            확인 완료 (계좌 복사 후 닫기)
                                        </button>
                                        <p className="text-[11px] text-gray-400 mt-2 font-medium">
                                            * 이 문의글과 자동 답변 내역은 마이페이지 및 고객센터 문의 내역에서 언제든지 다시 확인하실 수 있습니다.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
