'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Send, Clock, CheckCircle2, AlertCircle, ChevronDown, Plus } from 'lucide-react';
import type { UserInquiry } from '@/lib/actions/help';
import { createInquiry } from '@/lib/actions/help';

const INQUIRY_CATEGORIES = [
    '계정 문의',
    '포인트·환불',
    '광고 문의',
    '신고·제재',
    '건의사항',
    '기타',
];

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

export function InquiryPageClient({
    initialInquiries,
    isLoggedIn,
}: {
    initialInquiries: UserInquiry[];
    isLoggedIn: boolean;
}) {
    const router = useRouter();
    const [inquiries, setInquiries] = useState(initialInquiries);
    const [showForm, setShowForm] = useState(false);
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!isLoggedIn) {
            if (confirm('로그인 후 이용할 수 있습니다. 로그인 페이지로 이동하시겠습니까?')) {
                router.push('/login');
            }
            return;
        }
        if (!category || !title.trim() || !content.trim()) {
            alert('유형, 제목, 내용을 모두 입력해주세요.');
            return;
        }
        setSubmitting(true);
        const res = await createInquiry({ category, title, content });
        setSubmitting(false);
        if (res.success) {
            alert(res.message);
            setShowForm(false);
            setCategory('');
            setTitle('');
            setContent('');
            router.refresh();
        } else {
            alert(res.message);
        }
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
                    type="button"
                    onClick={() => {
                        if (!isLoggedIn) {
                            if (confirm('로그인 후 이용할 수 있습니다. 로그인 페이지로 이동하시겠습니까?')) {
                                router.push('/login');
                            }
                            return;
                        }
                        setShowForm(!showForm);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl hover:bg-orange-600 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    문의 작성
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
                    <h3 className="font-black text-[16px] text-gray-900">새 문의 작성</h3>
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">문의 유형 *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary font-medium"
                        >
                            <option value="">유형을 선택해주세요</option>
                            {INQUIRY_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">제목 *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary"
                            placeholder="문의 제목을 입력해주세요"
                        />
                    </div>
                    <div>
                        <label className="text-[12px] font-bold text-gray-600 mb-1.5 block">내용 *</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-primary resize-none"
                            placeholder="문의 내용을 상세히 적어주세요."
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-5 py-2.5 border border-gray-200 text-gray-600 font-bold text-[14px] rounded-xl"
                        >
                            취소
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-black text-[14px] rounded-xl disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {submitting ? '접수 중...' : '접수하기'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-black text-[14px] text-gray-700">내 문의 내역</h3>
                </div>

                {!isLoggedIn ? (
                    <div className="py-16 text-center text-gray-500 text-[14px]">
                        로그인 후 문의 내역을 확인할 수 있습니다.
                    </div>
                ) : inquiries.length === 0 ? (
                    <div className="py-16 flex flex-col items-center text-center gap-3">
                        <MessageCircle className="w-7 h-7 text-gray-300" />
                        <p className="text-[14px] font-bold text-gray-400">아직 문의 내역이 없습니다.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {inquiries.map((inq) => (
                            <div key={inq.id}>
                                <button
                                    type="button"
                                    onClick={() => setExpandedId(expandedId === inq.id ? null : inq.id)}
                                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50"
                                >
                                    <StatusBadge status={inq.status} />
                                    <span className="text-[12px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{inq.category}</span>
                                    <span className="flex-1 text-[14px] font-bold text-gray-800 truncate">{inq.title}</span>
                                    <span className="text-[12px] text-gray-400">
                                        {new Date(inq.created_at).toLocaleDateString()}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 ${expandedId === inq.id ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedId === inq.id && (
                                    <div className="px-5 pb-5 space-y-3">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <p className="text-[12px] font-bold text-gray-500 mb-1">내 문의</p>
                                            <p className="text-[14px] text-gray-700 whitespace-pre-line">{inq.content}</p>
                                        </div>
                                        {inq.reply && (
                                            <div className="bg-blue-50 rounded-xl p-4">
                                                <p className="text-[12px] font-bold text-blue-600 mb-1">
                                                    관리자 답변
                                                    {inq.replied_at ? ` (${new Date(inq.replied_at).toLocaleDateString()})` : ''}
                                                </p>
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

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-[13px] text-blue-700 leading-relaxed">
                    <p className="font-bold">답변 안내</p>
                    <p className="mt-1">
                        문의하신 내용은 영업일 기준 <strong>1~2일 이내</strong>에 답변드립니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
