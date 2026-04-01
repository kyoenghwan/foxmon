'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const faqCategories = ['전체', '이용 안내', '포인트·결제', '광고 문의', '이력서·지원', '기타'];

// 추후 QA 연동 예정
const mockFaqs = [
    { id: '1', category: '이용 안내', question: '회원가입은 어떻게 하나요?', answer: '메인 페이지 우측 상단 [회원가입] 버튼을 클릭하여 진행해주세요. 본인인증(휴대폰) 후 가입이 완료됩니다. 만 19세 이상만 가입 가능합니다.' },
    { id: '2', category: '이용 안내', question: '비밀번호를 잊어버렸어요.', answer: '로그인 페이지 하단의 [비밀번호 찾기]를 클릭하시면, 가입 시 등록한 이메일로 비밀번호 재설정 링크가 발송됩니다.' },
    { id: '3', category: '이용 안내', question: '회원 탈퇴하고 싶어요.', answer: '마이페이지 > 회원설정 > 맨 하단의 [회원 탈퇴] 버튼을 이용해주세요. 탈퇴 시 작성하신 이력서와 지원 기록은 즉시 삭제되며 복구가 불가능합니다.' },
    { id: '4', category: '포인트·결제', question: '포인트 충전은 어떻게 하나요?', answer: '업체관리 > 포인트 관리 메뉴에서 충전 금액을 선택하고 입금자명을 입력 후 [충전 신청]을 해주세요. 무통장 입금 확인 후 영업일 1일 이내에 포인트가 지급됩니다.' },
    { id: '5', category: '포인트·결제', question: '포인트 환불은 가능한가요?', answer: '유료 포인트(실결제 포인트)에 한해 환불이 가능합니다. 환불 시 10%의 수수료가 차감되며, 보너스 포인트는 환불 대상이 아닙니다. 업체관리 > 포인트 관리에서 환불을 신청해주세요.' },
    { id: '6', category: '포인트·결제', question: '등급(VIP/VVIP)은 어떤 혜택이 있나요?', answer: '등급별로 포인트 충전 시 추가 보너스가 지급됩니다. VIP는 10%, VVIP는 20%, VVVIP는 30%의 보너스 적립율이 적용됩니다. 등급은 누적 결제 금액과 연속 이용 기간에 따라 자동 승급됩니다.' },
    { id: '7', category: '광고 문의', question: '광고 등급(프리미엄/스페셜/일반)의 차이점은?', answer: '프리미엄은 메인 상단에 대형 배너로 노출되며, 스페셜은 상단 우선 노출, 일반은 기본 리스트에 표시됩니다. 각 등급별로 포인트 차감 금액이 다릅니다.' },
    { id: '8', category: '광고 문의', question: '광고는 몇 일 동안 게시되나요?', answer: '기본 30일 단위로 게시됩니다. 만료 전 연장이 가능하며, 포인트가 충분한 경우 자동 연장 옵션도 설정할 수 있습니다.' },
    { id: '9', category: '이력서·지원', question: '이력서는 몇 개까지 등록할 수 있나요?', answer: '이력서는 최대 5개까지 등록 가능합니다. 각 이력서마다 공개/비공개 설정이 가능하며, 공개된 이력서만 업체에서 검색할 수 있습니다.' },
    { id: '10', category: '이력서·지원', question: '지원 취소는 어떻게 하나요?', answer: '마이페이지 > 지원현황에서 지원한 공고를 확인하고 [지원 취소] 버튼을 눌러주세요. 단, 업체에서 이미 이력서를 열람한 경우 취소가 제한될 수 있습니다.' },
    { id: '11', category: '기타', question: '부적절한 광고를 신고하고 싶어요.', answer: '해당 광고 상세 페이지에서 [신고] 버튼을 클릭하시거나, 1:1 문의에서 "신고·제재" 카테고리로 신고해주세요. 확인 후 신속하게 처리하겠습니다.' },
];

function FaqItem({ faq }: { faq: typeof mockFaqs[0] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
                <span className="text-primary font-black text-[15px] shrink-0">Q</span>
                <span className="flex-1 text-[14px] font-bold text-gray-800">{faq.question}</span>
                <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">{faq.category}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-5 pb-5 flex gap-3">
                    <span className="text-blue-500 font-black text-[15px] shrink-0">A</span>
                    <p className="text-[14px] text-gray-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                </div>
            )}
        </div>
    );
}

export default function FaqPage() {
    const [activeCategory, setActiveCategory] = useState('전체');

    const filtered = activeCategory === '전체'
        ? mockFaqs
        : mockFaqs.filter(f => f.category === activeCategory);

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-primary" /> 자주 묻는 질문
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">
                    궁금한 사항은 아래에서 찾아보시고, 해결되지 않으면 1:1 문의를 이용해주세요.
                </p>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-2 flex-wrap">
                {faqCategories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                            activeCategory === cat
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* FAQ 리스트 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {filtered.map((faq) => (
                    <FaqItem key={faq.id} faq={faq} />
                ))}
                {filtered.length === 0 && (
                    <div className="py-16 text-center text-gray-400 text-[14px] font-medium">
                        해당 카테고리의 FAQ가 없습니다.
                    </div>
                )}
            </div>
        </div>
    );
}
