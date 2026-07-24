'use client';

import { useState, useTransition } from 'react';
import { replyInquiry, approveRechargeRequest, rejectRechargeRequest } from '@/lib/actions/admin-cs';
import { useRouter } from 'next/navigation';
import { MessageSquare, CreditCard, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Inquiry {
  id: string;
  category: string;
  title: string;
  content: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  userId: string;
  userNickname: string;
  userEmail: string;
}

interface Recharge {
  id: string;
  amount: number;
  depositorName: string;
  status: string;
  createdAt: string;
  userId: string;
  userNickname: string;
  userEmail: string;
}

interface CsDashboardClientProps {
  initialInquiries: Inquiry[];
  initialRecharges: Recharge[];
}

export default function CsDashboardClient({ initialInquiries, initialRecharges }: CsDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cs' | 'recharge'>('cs');
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // 1:1 문의 답변 처리
  const handleReplySubmit = async (inquiryId: string) => {
    if (!replyText.trim()) {
      alert('답변 내용을 입력해 주세요.');
      return;
    }

    setActionLoadingId(inquiryId);
    startTransition(async () => {
      const res = await replyInquiry({ inquiryId, replyContent: replyText });
      setActionLoadingId(null);
      if (res.success) {
        alert(res.message);
        setReplyText('');
        setExpandedInquiryId(null);
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  // 무통장 입금 승인 처리
  const handleApproveRecharge = async (requestId: string) => {
    if (!confirm('정말로 이 무통장 충전을 승인하시겠습니까?\n해당 회원에게 포인트가 즉시 지급됩니다.')) return;

    setActionLoadingId(requestId);
    startTransition(async () => {
      const res = await approveRechargeRequest(requestId);
      setActionLoadingId(null);
      if (res.success) {
        alert(res.message);
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  // 무통장 입금 반려 처리
  const handleRejectRecharge = async (requestId: string) => {
    if (!confirm('이 무통장 충전 요청을 반려(거절) 처리하시겠습니까?')) return;

    setActionLoadingId(requestId);
    startTransition(async () => {
      const res = await rejectRechargeRequest(requestId);
      setActionLoadingId(null);
      if (res.success) {
        alert(res.message);
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  // 미해결 건 개수 집계
  const pendingInquiriesCount = initialInquiries.filter(i => i.status === 'PENDING').length;
  const pendingRechargesCount = initialRecharges.filter(r => r.status === 'PENDING').length;

  return (
    <div className="w-full space-y-4">
      {/* 탭 네비게이션 (모바일 세로 최적화) */}
      <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
        <button
          onClick={() => setActiveTab('cs')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black transition-all ${
            activeTab === 'cs'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>1:1 문의 응대</span>
          {pendingInquiriesCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-bold ml-1 animate-pulse">
              {pendingInquiriesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('recharge')}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-black transition-all ${
            activeTab === 'recharge'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>무통장 승인</span>
          {pendingRechargesCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-bold ml-1 animate-pulse">
              {pendingRechargesCount}
            </span>
          )}
        </button>
      </div>

      {/* 1:1 문의 탭 콘텐트 */}
      {activeTab === 'cs' && (
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-gray-500 flex justify-between px-1">
            <span>문의 목록 (최신순)</span>
            <span>대기: {pendingInquiriesCount}건 / 완료: {initialInquiries.length - pendingInquiriesCount}건</span>
          </div>

          {initialInquiries.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-8 text-center text-xs text-gray-500">
              접수된 문의 내역이 없습니다.
            </div>
          ) : (
            initialInquiries.map((inq) => {
              const isExpanded = expandedInquiryId === inq.id;
              const isLoading = actionLoadingId === inq.id;

              return (
                <div
                  key={inq.id}
                  className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${
                    inq.status === 'PENDING' ? 'border-amber-500/30 bg-amber-500/[0.02]' : 'border-gray-800 bg-gray-900/60'
                  }`}
                >
                  {/* 카드 요약 헤더 */}
                  <div
                    onClick={() => {
                      setExpandedInquiryId(isExpanded ? null : inq.id);
                      setReplyText(inq.reply || '');
                    }}
                    className="p-4 cursor-pointer flex items-start justify-between gap-2 active:bg-gray-800/40"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-bold rounded border border-blue-500/20">
                          {inq.category}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                          inq.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                        }`}>
                          {inq.status === 'PENDING' ? '답변 대기' : '답변 완료'}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white truncate min-w-0">
                        {inq.title}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        작성: {inq.userNickname} ({inq.userEmail}) • {new Date(inq.createdAt).toLocaleString('ko-KR', { hour12: false })}
                      </p>
                    </div>
                    <div className="text-gray-500 pt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* 확장 아코디언 콘텐츠 */}
                  {isExpanded && (
                    <div className="border-t border-gray-800 p-4 bg-gray-950/50 space-y-4 text-xs">
                      {/* 문의 본문 */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-500">문의 내용:</span>
                        <p className="text-gray-200 bg-gray-900 p-3 rounded-lg border border-gray-800/80 whitespace-pre-wrap leading-relaxed">
                          {inq.content}
                        </p>
                      </div>

                      {/* 답변 양식 */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-gray-500">
                          {inq.status === 'PENDING' ? '답변 작성:' : '작성된 답변 내용 (수정 가능):'}
                        </span>
                        
                        <textarea
                          rows={4}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="고객에게 전달할 답변을 입력해 주세요. 작성 후 전송하시면 메인 고객센터 페이지에 실시간 반영됩니다."
                          className="w-full p-3 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                        />

                        <button
                          onClick={() => handleReplySubmit(inq.id)}
                          disabled={isLoading}
                          className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              답변 전송 중...
                            </>
                          ) : (
                            '답변 등록/수정 완료'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 무통장 승인 탭 콘텐트 */}
      {activeTab === 'recharge' && (
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-gray-500 flex justify-between px-1">
            <span>무통장 충전 요청 목록 (최신순)</span>
            <span>대기: {pendingRechargesCount}건</span>
          </div>

          {initialRecharges.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-8 text-center text-xs text-gray-500">
              접수된 무통장 입금 충전 신청이 없습니다.
            </div>
          ) : (
            initialRecharges.map((rec) => {
              const isLoading = actionLoadingId === rec.id;

              return (
                <div
                  key={rec.id}
                  className={`bg-gray-900 border rounded-xl p-4 transition-all ${
                    rec.status === 'PENDING' ? 'border-amber-500/30 bg-amber-500/[0.01]' : 'border-gray-800 bg-gray-900/40'
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    {/* 상태 및 헤더 */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                        rec.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        rec.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {rec.status === 'PENDING' ? '승인 대기' :
                         rec.status === 'APPROVED' ? '승인 완료' : '반려됨'}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(rec.createdAt).toLocaleString('ko-KR', { hour12: false })}
                      </span>
                    </div>

                    {/* 입금 정보 요약 */}
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between border-b border-gray-800/80 pb-1.5">
                        <span className="text-gray-400">신청회원</span>
                        <span className="font-bold text-white">{rec.userNickname} ({rec.userEmail})</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800/80 pb-1.5 pt-0.5">
                        <span className="text-gray-400">입금자 실명</span>
                        <span className="font-bold text-amber-400">{rec.depositorName}</span>
                      </div>
                      <div className="flex justify-between pt-0.5">
                        <span className="text-gray-400">신청금액</span>
                        <span className="font-extrabold text-white text-sm">{rec.amount.toLocaleString()} P</span>
                      </div>
                    </div>

                    {/* 조작 버튼 영역 (대기 중일 때만 표시) */}
                    {rec.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-800/80">
                        <button
                          onClick={() => handleRejectRecharge(rec.id)}
                          disabled={isLoading}
                          className="h-9 bg-gray-800 hover:bg-red-950/40 text-gray-400 hover:text-red-400 text-xs font-black rounded-lg border border-gray-700/80 hover:border-red-900/30 transition-all flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          반려
                        </button>
                        
                        <button
                          onClick={() => handleApproveRecharge(rec.id)}
                          disabled={isLoading}
                          className="h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 text-white text-xs font-black rounded-lg shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-1"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              입금 승인
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
