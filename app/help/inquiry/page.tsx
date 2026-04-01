'use client';

import { useState } from 'react';
import { MessageCircle, Send, Clock, CheckCircle2, AlertCircle, ChevronDown, Plus } from 'lucide-react';

const INQUIRY_CATEGORIES = [
    '계정 문의',
    '포인트·환불',
    '광고 문의',
    '신고·제재',
    '건의사항',
    '기타',
];

// 추후 QA/OA 연동 예정
const mockInquiries: any[] = [];

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; style: string; icon: React.ReactNode }> = {
        PENDING: { label: '답변 대기', style: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
        ANSWERED: { label: '답변 완료', style: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="w-3 h-3" /> },
        CLOSED: { label: '처리 완료', style: 'bg-gray-100 text-gray-500', icon: <CheckCircle2 className="w-3 h-3" /> },
    };
    const info = map[status] || map.PENDING;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${info.style}`}>
            {info.icon} {info.label}
        </span>
    );
};

export default function InquiryPage() {
    const [showForm, setShowForm] = useState(false);
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!category || !title || !content) {
            alert('유형, 제목, 내용을 모두 입력해주세요.');
            return;
        }
        // 추후 OA_CREATE_INQUIRY 연동
        alert('문의가 접수되었습니다.\n답변은 쪽지함 및 이메일로 전달드리겠습니다.');
        setShowForm(false);
        setCategory('');
        setTitle('');
        setContent('');
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" /> 1:1 문의
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium mt-1">
                        궁금하신 점이나 건의사항을 남겨주세요. 답변은 쪽지함과 이메일로 전달됩니다.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    문의 작성
                </button>
            </div>

            {/* 문의 작성 폼 */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
                    <h3 className="font-black text-[16px] text-gray-900">새 문의 작성</h3>
                    
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">문의 유형 <span className="text-red-500">*</span></label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary font-medium"
                        >
                            <option value="">유형을 선택해주세요</option>
                            {INQUIRY_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">제목 <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                            placeholder="문의 제목을 입력해주세요"
                        />
                    </div>

                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">내용 <span className="text-red-500">*</span></label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary resize-none leading-relaxed"
                            placeholder="문의 내용을 상세히 적어주시면 빠른 답변에 도움이 됩니다."
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button 
                            onClick={() => setShowForm(false)}
                            className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold text-[14px] rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            취소
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                            접수하기
                        </button>
                    </div>
                </div>
            )}

            {/* 내 문의 내역 */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-black text-[14px] text-gray-700">내 문의 내역</h3>
                </div>

                {mockInquiries.length === 0 ? (
                    <div className="py-16 flex flex-col items-center text-center gap-3">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <MessageCircle className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-[14px] font-bold text-gray-400">아직 문의 내역이 없습니다.</p>
                        <p className="text-[12px] text-gray-400">궁금한 점이 있으시면 위의 [문의 작성] 버튼을 눌려주세요.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {mockInquiries.map((inq: any) => (
                            <div key={inq.id}>
                                <button
                                    onClick={() => setExpandedId(expandedId === inq.id ? null : inq.id)}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <StatusBadge status={inq.status} />
                                    <span className="text-[12px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{inq.category}</span>
                                    <span className="flex-1 text-[14px] font-bold text-gray-800 truncate">{inq.title}</span>
                                    <span className="text-[12px] text-gray-400">{new Date(inq.created_at).toLocaleDateString()}</span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === inq.id ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedId === inq.id && (
                                    <div className="px-5 pb-5 space-y-3">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <p className="text-[12px] font-bold text-gray-500 mb-1">내 문의</p>
                                            <p className="text-[14px] text-gray-700 whitespace-pre-line">{inq.content}</p>
                                        </div>
                                        {inq.reply && (
                                            <div className="bg-blue-50 rounded-xl p-4">
                                                <p className="text-[12px] font-bold text-blue-600 mb-1">관리자 답변 ({new Date(inq.replied_at).toLocaleDateString()})</p>
                                                <p className="text-[14px] text-gray-700 whitespace-pre-line">{inq.reply}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 안내 카드 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-[13px] text-blue-700 leading-relaxed">
                    <p className="font-bold">답변 안내</p>
                    <p className="mt-1">
                        문의하신 내용은 영업일 기준 <strong>1~2일 이내</strong>에 답변드립니다.
                        답변은 <strong>쪽지함</strong>과 등록하신 <strong>이메일</strong>로 동시에 발송됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
