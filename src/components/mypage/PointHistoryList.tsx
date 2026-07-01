'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Minus, Inbox, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface PointHistoryListProps {
  refreshTrigger?: number; // 부모 컴포넌트에서 강제 갱신용으로 보낼 숫자 트리거
  className?: string;
}

const TYPE_MAP: Record<string, { label: string; bg: string; text: string }> = {
  POST: { label: '글 작성', bg: 'bg-green-50 text-green-700 border-green-100', text: 'text-green-600' },
  COMMENT: { label: '댓글 작성', bg: 'bg-blue-50 text-blue-700 border-blue-100', text: 'text-blue-600' },
  ATTENDANCE: { label: '출석체크', bg: 'bg-yellow-50 text-yellow-700 border-yellow-100', text: 'text-yellow-600' },
  GAME_REWARD: { label: '게임 보상', bg: 'bg-pink-50 text-pink-700 border-pink-100', text: 'text-pink-600' },
  ROULETTE_REWARD: { label: '룰렛 당첨', bg: 'bg-pink-50 text-pink-700 border-pink-100', text: 'text-pink-600' },
  LUCKYBOX_REWARD: { label: '랜덤박스', bg: 'bg-orange-50 text-orange-700 border-orange-100', text: 'text-orange-600' },
  RETRODRAW_REWARD: { label: '종이뽑기', bg: 'bg-amber-50 text-amber-700 border-amber-100', text: 'text-amber-600' },
  REFERRAL_SIGNUP: { label: '추천 가입', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', text: 'text-indigo-600' },
  REFERRAL_BONUS: { label: '추천 보너스', bg: 'bg-purple-50 text-purple-700 border-purple-100', text: 'text-purple-600' },
  GIFT_CARD_REQUEST: { label: '상품권 교환', bg: 'bg-red-50 text-red-700 border-red-100', text: 'text-red-600' },
  ADMIN_ADJUST: { label: '포인트 조정', bg: 'bg-gray-100 text-gray-700 border-gray-200', text: 'text-gray-600' },
  POST_DELETE: { label: '글 삭제', bg: 'bg-red-50 text-red-700 border-red-100', text: 'text-red-600' },
  COMMENT_DELETE: { label: '댓글 삭제', bg: 'bg-red-50 text-red-700 border-red-100', text: 'text-red-600' },
  LIKE_RECEIVED: { label: '공감 획득', bg: 'bg-pink-50 text-pink-700 border-pink-100', text: 'text-pink-600' },
  LIKE_CANCELED: { label: '공감 취소', bg: 'bg-red-50 text-red-700 border-red-100', text: 'text-red-600' },
  ATTENDANCE_STREAK_3: { label: '출석 3일', bg: 'bg-yellow-50 text-yellow-700 border-yellow-100', text: 'text-yellow-600' },
  ATTENDANCE_STREAK_7: { label: '출석 7일', bg: 'bg-yellow-50 text-yellow-700 border-yellow-100', text: 'text-yellow-600' },
  ATTENDANCE_STREAK_15: { label: '출석 15일', bg: 'bg-yellow-50 text-yellow-700 border-yellow-100', text: 'text-yellow-600' },
  ATTENDANCE_STREAK_30: { label: '출석 30일', bg: 'bg-yellow-50 text-yellow-700 border-yellow-100', text: 'text-yellow-600' }
};

export function PointHistoryList({ refreshTrigger = 0, className }: PointHistoryListProps) {
  const [list, setList] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchHistory = async (p: number, concatData: boolean = false) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/point-history?page=${p}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setList(prev => concatData ? [...prev, ...data.list] : data.list);
        setTotal(data.total);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchHistory(1, false);
  }, [refreshTrigger]);

  const handleLoadMore = () => {
    if (loading || list.length >= total) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-black text-gray-500 tracking-wider">포인트 이용 내역</span>
        <span className="text-[10px] text-gray-400 font-semibold">총 {total} 건의 내역</span>
      </div>

      {list.length === 0 && !loading && !error && (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-3 shadow-md">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
            <Inbox className="w-5 h-5" />
          </div>
          <span className="text-xs text-gray-400 font-black">포인트 이용 내역이 존재하지 않습니다.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <span className="text-xs text-red-700 font-black">내역을 불러오지 못했습니다.</span>
          <button onClick={() => fetchHistory(page, false)} className="text-[10px] text-purple-600 underline font-bold mt-1">다시 시도</button>
        </div>
      )}

      {/* 데스크탑 와이드 테이블 뷰 */}
      {list.length > 0 && (
        <div className="hidden sm:block overflow-hidden border border-gray-100 rounded-2xl shadow-sm">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-black text-gray-500">
                <th className="py-3 px-4 w-[140px]">일시</th>
                <th className="py-3 px-4 w-[110px]">구분</th>
                <th className="py-3 px-4">상세 이용 내역</th>
                <th className="py-3 px-4 text-right w-[110px]">변동</th>
                <th className="py-3 px-4 text-right w-[120px]">포인트 잔액</th>
              </tr>
            </thead>
            <tbody>
              {list.map((tx) => {
                const typeInfo = TYPE_MAP[tx.type] || { label: tx.type, bg: 'bg-gray-50 text-gray-700 border-gray-100', text: 'text-gray-600' };
                const isPositive = tx.amount > 0;
                const formattedDate = new Date(tx.created_at).toLocaleDateString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                    <td className="py-3 px-4 text-[11px] text-gray-400 font-medium">
                      {formattedDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2.5 py-0.5 text-[9px] font-black border rounded-md inline-block select-none whitespace-nowrap",
                        typeInfo.bg
                      )}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[12px] font-bold text-gray-700 break-all leading-normal">
                      {tx.description || '포인트 변동'}
                    </td>
                    <td className={cn(
                      "py-3 px-4 text-[12px] font-black text-right tracking-tight",
                      isPositive ? "text-purple-600" : "text-red-500"
                    )}>
                      {isPositive ? `+${tx.amount}` : tx.amount.toLocaleString()}p
                    </td>
                    <td className="py-3 px-4 text-[12px] font-bold text-right text-gray-500">
                      {tx.balance_after.toLocaleString()}p
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 모바일 카드 리스트 뷰 */}
      <div className="sm:hidden space-y-2">
        {list.map((tx) => {
          const typeInfo = TYPE_MAP[tx.type] || { label: tx.type, bg: 'bg-gray-50 text-gray-700 border-gray-100', text: 'text-gray-600' };
          const isPositive = tx.amount > 0;
          const formattedDate = new Date(tx.created_at).toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div 
              key={tx.id}
              className="bg-white border border-gray-100 hover:border-gray-200 rounded-2xl p-4 flex justify-between items-center transition-all shadow-sm duration-200 group"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className={cn(
                  "px-2.5 py-1 text-[9px] font-black border rounded-lg shrink-0 select-none whitespace-nowrap",
                  typeInfo.bg
                )}>
                  {typeInfo.label}
                </span>
                <div className="text-left min-w-0 flex-1">
                  <div className="text-xs font-black text-gray-900 group-hover:text-purple-700 transition-colors break-keep leading-snug">
                    {tx.description || '포인트 변동'}
                  </div>
                  <div className="text-[9px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                    <Calendar className="w-2.5 h-2.5 shrink-0" />
                    {formattedDate}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 ml-4">
                <div className={cn(
                  "text-xs font-black tracking-tight flex items-center justify-end gap-0.5",
                  isPositive ? "text-purple-600" : "text-red-500"
                )}>
                  {isPositive ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {Math.abs(tx.amount).toLocaleString()}p
                </div>
                <div className="text-[9px] text-gray-400 font-semibold mt-0.5">
                  잔액 {tx.balance_after.toLocaleString()}p
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {list.length < total && (
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className="w-full h-11 bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl font-black text-xs text-gray-500 tracking-tight transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          ) : (
            '활동 포인트 내역 더 보기'
          )}
        </button>
      )}

      {loading && list.length === 0 && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-7 h-7 text-purple-600 animate-spin" />
        </div>
      )}

    </div>
  );
}
