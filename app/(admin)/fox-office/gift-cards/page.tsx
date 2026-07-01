'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, X, ShieldAlert, Award, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GiftCardRequest {
  id: string;
  user_id: string;
  gift_card_type: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  users?: {
    login_id: string;
    nickname: string;
  };
}

const TYPE_MAP: Record<string, string> = {
  CULTURE_LAND: '컬쳐랜드 문화상품권',
  HAPPY_MONEY: '해피머니 상품권',
  GOOGLE_PLAY: '구글플레이 기프트카드'
};

export default function AdminGiftCardsPage() {
  const [list, setList] = useState<GiftCardRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gift-cards?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setList(data.list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    const confirmMsg = action === 'APPROVE' 
      ? '해당 교환 신청을 승인하시겠습니까?' 
      : '해당 교환 신청을 반려하시겠습니까?\n반려 시 사용자의 포인트가 100% 자동으로 환불(복구)됩니다.';
    
    if (!window.confirm(confirmMsg)) return;

    setProcessingId(requestId);
    try {
      const res = await fetch('/api/admin/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchRequests();
      } else {
        alert(data.message || '처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-4 animate-in fade-in duration-500">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" /> 상품권 교환 신청 관리
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            일반 회원들의 활동 포인트 상품권 교환 신청을 검토하고 승인/반려합니다.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-50 p-1 rounded-2xl w-fit border border-gray-100">
        {[
          { id: 'ALL', label: '전체' },
          { id: 'PENDING', label: '대기 중인 신청' },
          { id: 'APPROVED', label: '승인 완료' },
          { id: 'REJECTED', label: '반려됨' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-200",
              filter === tab.id
                ? "bg-white text-purple-700 shadow-md"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Container */}
      <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="text-xs text-gray-400 font-bold">신청 목록을 불러오는 중...</span>
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs text-gray-400 font-black">해당하는 상품권 신청 내역이 없습니다.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="p-4 pl-6">신청일</th>
                  <th className="p-4">신청자 (아이디/닉네임)</th>
                  <th className="p-4">상품권 종류</th>
                  <th className="p-4 text-right">신청 금액 (포인트)</th>
                  <th className="p-4 text-center">상태</th>
                  <th className="p-4 pr-6 text-center">관리 액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {list.map((req) => {
                  const formattedDate = new Date(req.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 pl-6 text-gray-400 text-[11px] font-medium">{formattedDate}</td>
                      <td className="p-4">
                        <div className="font-black text-gray-900">{req.users?.nickname || '익명'}</div>
                        <div className="text-[10px] text-gray-400 font-medium">@{req.users?.login_id || 'unknown'}</div>
                      </td>
                      <td className="p-4 font-black">{TYPE_MAP[req.gift_card_type] || req.gift_card_type}</td>
                      <td className="p-4 text-right font-black text-purple-700">{req.amount.toLocaleString()}p</td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                          req.status === 'PENDING' 
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            : req.status === 'APPROVED'
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                        )}>
                          {req.status === 'PENDING' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                          {req.status === 'APPROVED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {req.status === 'REJECTED' && <XCircle className="w-2.5 h-2.5" />}
                          {req.status === 'PENDING' ? '대기 중' : req.status === 'APPROVED' ? '승인됨' : '반려됨'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        {req.status === 'PENDING' ? (
                          <div className="flex justify-center gap-1.5">
                            <Button
                              size="sm"
                              disabled={processingId !== null}
                              onClick={() => handleAction(req.id, 'APPROVE')}
                              className="h-8 px-3.5 bg-green-600 hover:bg-green-700 text-white font-black text-[11px] rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> 승인
                            </Button>
                            <Button
                              size="sm"
                              disabled={processingId !== null}
                              onClick={() => handleAction(req.id, 'REJECT')}
                              className="h-8 px-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-[11px] rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> 반려
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety Notice */}
      <div className="bg-purple-50/30 border border-purple-100 rounded-2xl p-5 flex items-start gap-3 text-xs text-purple-950 font-medium">
        <ShieldAlert className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">상품권 지급 운영 지침</span>
          <p className="text-[11px] text-purple-900 mt-1">
            - **승인**: 승인 처리 완료 후, 가입된 계정 이메일/문자로 핀번호를 수동으로 발급 발송해 주어야 합니다.<br />
            - **반려**: 반려 처리 즉시 사용자가 신청에 소모한 활동 포인트가 **원자적으로 자동 환불 반환**되며, 포인트 복구 원장 이력이 기록됩니다.
          </p>
        </div>
      </div>

    </div>
  );
}
