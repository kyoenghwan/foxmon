'use client';

import { useState, useTransition, useEffect } from 'react';
import { replyInquiry, approveRechargeRequest, rejectRechargeRequest, generateAiReply } from '@/lib/actions/admin-cs';
import { logoutCsTerminal } from '@/lib/actions/admin-cs-auth';
import { CsMessengerPanel } from '@/components/chat/CsMessengerPanel';
import { useRouter } from 'next/navigation';
import { MessageSquare, CreditCard, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle, LogOut, MessageCircle, Clock, Calendar, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  rejectReason: string | null;
  createdAt: string;
  userId: string;
  userNickname: string;
  userEmail: string;
}

interface CsTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface CsDashboardClientProps {
  initialInquiries: Inquiry[];
  initialRecharges: Recharge[];
  csAdminUserId: string;
  csAdminName?: string;
  templates: CsTemplate[];
}

export default function CsDashboardClient({ initialInquiries, initialRecharges, csAdminUserId, csAdminName, templates }: CsDashboardClientProps) {
  const router = useRouter();
  // 디폴트를 실시간 메신저 상담('chat')으로 배치
  const [activeTab, setActiveTab] = useState<'chat' | 'cs' | 'recharge'>('chat');
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  
  const [isPending, startTransition] = useTransition();
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [aiGeneratingId, setAiGeneratingId] = useState<string | null>(null);

  // 반려 전용 모달 상태
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  // 1:1 문의 검색 필터 상태
  const [showOnlyPendingInquiry, setShowOnlyPendingInquiry] = useState(true);
  const [inquirySearchKeyword, setInquirySearchKeyword] = useState('');
  const [inquiryStartDate, setInquiryStartDate] = useState('');
  const [inquiryEndDate, setInquiryEndDate] = useState('');

  // 무통장 승인 검색 필터 상태
  const [showOnlyPendingRecharge, setShowOnlyPendingRecharge] = useState(true);
  const [rechargeSearchKeyword, setRechargeSearchKeyword] = useState('');
  const [rechargeStartDate, setRechargeStartDate] = useState('');
  const [rechargeEndDate, setRechargeEndDate] = useState('');

  // 1:1 문의 및 무통장 신청서 실시간 갱신 수신 설정
  useEffect(() => {
    // 1. 1:1 문의 채널
    const inquiryChannel = supabase
      .channel('realtime-inquiries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    // 2. 무통장 입금 신청 채널
    const rechargeChannel = supabase
      .channel('realtime-recharges')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'point_recharge_requests' },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inquiryChannel);
      supabase.removeChannel(rechargeChannel);
    };
  }, [router]);

  // 로그아웃
  const handleLogout = async () => {
    if (!confirm('CS 터미널 로그아웃을 진행하시겠습니까?')) return;
    setIsLoggingOut(true);
    try {
      const res = await logoutCsTerminal();
      if (res.success) {
        window.location.href = '/cs/login';
      }
    } catch (e) {
      alert('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // AI 답변 자동 생성
  const handleAiReplyGenerate = async (inquiryId: string) => {
    setAiGeneratingId(inquiryId);
    try {
      const res = await generateAiReply({ inquiryId });
      if (res.success && res.replyText) {
        setReplyText(res.replyText);
      } else {
        alert(res.message || 'AI 답변을 생성하지 못했습니다.');
      }
    } catch (e) {
      alert('AI 답변 생성 도중 오류가 발생했습니다.');
    } finally {
      setAiGeneratingId(null);
    }
  };

  // 1:1 문의 답변 등록
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

  // 무통장 입금 승인
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

  // 무통장 입금 반려 모달 활성화
  const handleRejectRecharge = (requestId: string) => {
    setRejectTargetId(requestId);
    setRejectReasonInput('');
    setIsRejectModalOpen(true);
  };

  // 무통장 입금 반려 서버 전송
  const submitRejectRecharge = async () => {
    if (!rejectTargetId) return;
    const trimmedReason = rejectReasonInput.trim();
    if (!trimmedReason) {
      alert('반려 사유를 반드시 입력해야 처리할 수 있습니다.');
      return;
    }

    setActionLoadingId(rejectTargetId);
    setIsRejectModalOpen(false);
    startTransition(async () => {
      const res = await rejectRechargeRequest(rejectTargetId, trimmedReason);
      setActionLoadingId(null);
      setRejectTargetId(null);
      setRejectReasonInput('');
      if (res.success) {
        alert(res.message);
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  const pendingInquiriesCount = initialInquiries.filter(i => i.status === 'PENDING').length;
  const pendingRechargesCount = initialRecharges.filter(r => r.status === 'PENDING').length;

  // 1:1 문의 필터링 적용
  const filteredInquiries = initialInquiries.filter((inq) => {
    if (showOnlyPendingInquiry && inq.status !== 'PENDING') return false;
    
    if (inquirySearchKeyword.trim()) {
      const keyword = inquirySearchKeyword.toLowerCase();
      const matchNickname = inq.userNickname.toLowerCase().includes(keyword);
      const matchEmail = inq.userEmail.toLowerCase().includes(keyword);
      const matchTitle = inq.title.toLowerCase().includes(keyword);
      const matchCategory = inq.category.toLowerCase().includes(keyword);
      if (!matchNickname && !matchEmail && !matchTitle && !matchCategory) return false;
    }

    if (inquiryStartDate) {
      const start = new Date(inquiryStartDate);
      start.setHours(0, 0, 0, 0);
      if (new Date(inq.createdAt) < start) return false;
    }
    if (inquiryEndDate) {
      const end = new Date(inquiryEndDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(inq.createdAt) > end) return false;
    }

    return true;
  });

  // 무통장 신청 필터링 적용
  const filteredRecharges = initialRecharges.filter((rec) => {
    if (showOnlyPendingRecharge && rec.status !== 'PENDING') return false;

    if (rechargeSearchKeyword.trim()) {
      const keyword = rechargeSearchKeyword.toLowerCase();
      const matchNickname = rec.userNickname.toLowerCase().includes(keyword);
      const matchEmail = rec.userEmail.toLowerCase().includes(keyword);
      const matchDepositor = rec.depositorName.toLowerCase().includes(keyword);
      if (!matchNickname && !matchEmail && !matchDepositor) return false;
    }

    if (rechargeStartDate) {
      const start = new Date(rechargeStartDate);
      start.setHours(0, 0, 0, 0);
      if (new Date(rec.createdAt) < start) return false;
    }
    if (rechargeEndDate) {
      const end = new Date(rechargeEndDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(rec.createdAt) > end) return false;
    }

    return true;
  });

  return (
    <div className="w-full space-y-4">
      {/* 1. 최상단 앱 바 */}
      <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-1">
        <div className="space-y-0.5">
          <h1 className="text-base font-black text-white flex items-center gap-1.5">
            🦊 FOXMON CS 모바일 터미널
          </h1>
          <p className="text-[10px] text-gray-500 font-bold">
            순수 고객센터 실시간 관리용 웹앱
          </p>
        </div>
        <div className="flex items-center gap-3">
          {csAdminName && (
            <span className="text-[11px] text-gray-400 font-bold bg-gray-900 border border-gray-800 px-2.5 py-1.5 rounded-xl">
              👤 {csAdminName} 님
            </span>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-8 px-3 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white text-[11px] font-black rounded-xl flex items-center gap-1 transition-all"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            로그아웃
          </button>
        </div>
      </div>

      {/* 2. 3분할 탭 네비게이션 */}
      <div className="grid grid-cols-3 gap-1.5 bg-gray-900 p-1.5 rounded-xl border border-gray-800">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[10px] font-black transition-all ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4 shrink-0 mb-0.5" />
          <span>실시간 상담</span>
        </button>

        <button
          onClick={() => setActiveTab('cs')}
          className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[10px] font-black transition-all relative ${
            activeTab === 'cs'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0 mb-0.5" />
          <span>1:1 문의</span>
          {pendingInquiriesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-full font-bold animate-pulse">
              {pendingInquiriesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('recharge')}
          className={`flex flex-col items-center justify-center py-2.5 rounded-lg text-[10px] font-black transition-all relative ${
            activeTab === 'recharge'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0 mb-0.5" />
          <span>무통장 승인</span>
          {pendingRechargesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-full font-bold animate-pulse">
              {pendingRechargesCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. 실시간 메신저 상담 탭 */}
      {activeTab === 'chat' && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-gray-500 px-1">
            실시간 메신저 상담방 목록
          </div>
          {/* 가독성 증대 및 다크모드 내 블랙 충돌 방지를 위해 white 패널 기입 */}
          <div className="bg-white rounded-2xl border border-gray-200 min-h-[500px] flex flex-col overflow-hidden text-black">
            <CsMessengerPanel csAdminUserId={csAdminUserId} compact={true} />
          </div>
        </div>
      )}

      {/* 4. 1:1 문의 탭 */}
      {activeTab === 'cs' && (
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-gray-500 flex justify-between px-1">
            <span>문의 답변 리스트</span>
            <span>대기: {pendingInquiriesCount}건 / 검색결과: {filteredInquiries.length}건</span>
          </div>

          {/* 1:1 문의 검색 및 필터 바 */}
          <div className="bg-gray-900/40 border border-gray-850 p-3.5 rounded-xl flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
              {/* 왼쪽: 검색어 입력 및 날짜 범위 */}
              <div className="flex flex-1 flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="제목, ID, 닉네임, 카테고리 검색..."
                    value={inquirySearchKeyword}
                    onChange={(e) => setInquirySearchKeyword(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-gray-950 border border-gray-800 text-xs text-white rounded-lg placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={inquiryStartDate}
                    onChange={(e) => setInquiryStartDate(e.target.value)}
                    className="h-9 px-2 bg-gray-950 border border-gray-800 text-xs text-white rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                  />
                  <span className="text-gray-600 text-xs">~</span>
                  <input
                    type="date"
                    value={inquiryEndDate}
                    onChange={(e) => setInquiryEndDate(e.target.value)}
                    className="h-9 px-2 bg-gray-950 border border-gray-800 text-xs text-white rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>
              </div>

              {/* 오른쪽: 필터 및 초기화 버튼 */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowOnlyPendingInquiry(!showOnlyPendingInquiry)}
                  className={`h-9 px-3 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    showOnlyPendingInquiry
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-gray-950 text-gray-500 border-gray-850 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  답변 대기만 보기
                </button>

                {(inquirySearchKeyword || inquiryStartDate || inquiryEndDate || showOnlyPendingInquiry) && (
                  <button
                    onClick={() => {
                      setInquirySearchKeyword('');
                      setInquiryStartDate('');
                      setInquiryEndDate('');
                      setShowOnlyPendingInquiry(false);
                    }}
                    className="h-9 px-2.5 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-bold rounded-lg transition-all"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredInquiries.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-850 rounded-xl p-8 text-center text-xs text-gray-500">
              검색 조건에 일치하는 문의 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInquiries.map((inq) => {
                const isExpanded = expandedInquiryId === inq.id;
                const isLoading = actionLoadingId === inq.id;

                return (
                  <div
                    key={inq.id}
                    className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${
                      inq.status === 'PENDING' ? 'border-amber-500/30 bg-amber-500/[0.02]' : 'border-gray-800 bg-gray-900/60'
                    }`}
                  >
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

                    {isExpanded && (
                      <div className="border-t border-gray-800 p-4 bg-gray-950/50 space-y-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-500">문의 내용:</span>
                          <p className="text-gray-200 bg-gray-900 p-3 rounded-lg border border-gray-800/80 whitespace-pre-wrap leading-relaxed">
                            {inq.content}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-gray-500">
                              {inq.status === 'PENDING' ? '답변 작성:' : '작성된 답변 내용 (수정 가능):'}
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => handleAiReplyGenerate(inq.id)}
                              disabled={aiGeneratingId === inq.id}
                              className="px-2.5 py-1 bg-purple-600/10 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-500/20 text-[10px] font-black rounded-lg transition-all flex items-center gap-1"
                            >
                              {aiGeneratingId === inq.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  초안 생성 중...
                                </>
                              ) : (
                                <>
                                  <span>🤖 AI 답변 초안 생성</span>
                                </>
                              )}
                            </button>
                          </div>
                          
                          {/* 자주 쓰는 답변 매크로 리스트 */}
                          <div className="flex flex-wrap gap-1.5 py-1">
                            {templates
                              .filter((t) => t.category === 'INQUIRY_REPLY' || t.category === 'GENERAL')
                              .map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    if (!replyText.trim()) {
                                      setReplyText(t.content);
                                    } else {
                                      setReplyText((prev) => prev + '\n\n' + t.content);
                                    }
                                  }}
                                  className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-[10px] rounded-lg transition-all"
                                >
                                  📋 {t.title}
                                </button>
                              ))}
                          </div>
                          
                          <textarea
                            rows={4}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="고객에게 전달할 답변을 입력해 주세요."
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
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. 무통장 승인 탭 */}
      {activeTab === 'recharge' && (
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-gray-500 flex justify-between px-1">
            <span>무통장 충전 요청 목록 (최신순)</span>
            <span>대기: {pendingRechargesCount}건 / 검색결과: {filteredRecharges.length}건</span>
          </div>

          {/* 무통장 검색 및 필터 바 */}
          <div className="bg-gray-900/40 border border-gray-850 p-3.5 rounded-xl flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
              {/* 왼쪽: 검색어 입력 및 날짜 범위 */}
              <div className="flex flex-1 flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="입금자 실명, ID, 닉네임 검색..."
                    value={rechargeSearchKeyword}
                    onChange={(e) => setRechargeSearchKeyword(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 bg-gray-950 border border-gray-800 text-xs text-white rounded-lg placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={rechargeStartDate}
                    onChange={(e) => setRechargeStartDate(e.target.value)}
                    className="h-9 px-2 bg-gray-950 border border-gray-800 text-xs text-white rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                  />
                  <span className="text-gray-600 text-xs">~</span>
                  <input
                    type="date"
                    value={rechargeEndDate}
                    onChange={(e) => setRechargeEndDate(e.target.value)}
                    className="h-9 px-2 bg-gray-950 border border-gray-800 text-xs text-white rounded-lg focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>
              </div>

              {/* 오른쪽: 필터 및 초기화 버튼 */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowOnlyPendingRecharge(!showOnlyPendingRecharge)}
                  className={`h-9 px-3 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    showOnlyPendingRecharge
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-gray-950 text-gray-500 border-gray-850 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  승인 대기만 보기
                </button>

                {(rechargeSearchKeyword || rechargeStartDate || rechargeEndDate || showOnlyPendingRecharge) && (
                  <button
                    onClick={() => {
                      setRechargeSearchKeyword('');
                      setRechargeStartDate('');
                      setRechargeEndDate('');
                      setShowOnlyPendingRecharge(false);
                    }}
                    className="h-9 px-2.5 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 font-bold rounded-lg transition-all"
                  >
                    초기화
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredRecharges.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-850 rounded-xl p-8 text-center text-xs text-gray-500">
              검색 조건에 일치하는 충전 신청이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecharges.map((rec) => {
                const isLoading = actionLoadingId === rec.id;

                return (
                  <div
                    key={rec.id}
                    className={`bg-gray-900 border rounded-xl p-4 transition-all ${
                      rec.status === 'PENDING' ? 'border-amber-500/30 bg-amber-500/[0.01]' : 'border-gray-800 bg-gray-900/40'
                    }`}
                  >
                    <div className="flex flex-col gap-3">
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
                        {rec.status === 'REJECTED' && rec.rejectReason && (
                          <div className="flex justify-between border-t border-gray-800/80 pt-1.5 mt-1.5">
                            <span className="text-red-400">반려 사유</span>
                            <span className="font-bold text-red-400">{rec.rejectReason}</span>
                          </div>
                        )}
                      </div>

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
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. 무통장 반려 전용 모달 (자주 쓰는 사유 선택 포함) */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/60">
              <h3 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-500" />
                무통장 입금 신청 반려 처리
              </h3>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* 자주 쓰는 반려 사유 리스트 */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 block">자주 쓰는 반려 사유 선택:</span>
                <div className="flex flex-col gap-1.5">
                  {templates
                    .filter((t) => t.category === 'RECHARGE_REJECT')
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setRejectReasonInput(t.content)}
                        className="w-full p-2.5 bg-gray-800 hover:bg-gray-700 text-left text-xs text-gray-200 border border-gray-700 rounded-xl transition-all"
                      >
                        📌 {t.title}
                      </button>
                    ))}
                </div>
              </div>

              {/* 반려 사유 직접 입력/수정 */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-500 block">반려 사유 상세 내용 (수정/직접 입력):</span>
                <textarea
                  rows={4}
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="회원에게 전송될 상세 반려 사유를 작성해 주세요."
                  className="w-full p-3 bg-gray-950 border border-gray-850 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-950/60 border-t border-gray-800 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="h-10 bg-gray-850 hover:bg-gray-800 text-xs font-bold rounded-xl border border-gray-800 text-gray-400 transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitRejectRecharge}
                className="h-10 bg-red-600 hover:bg-red-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-red-500/10 transition-all"
              >
                반려 처리 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
