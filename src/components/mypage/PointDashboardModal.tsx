'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AttendanceCheck } from '@/src/components/mypage/AttendanceCheck';
import { PointHistoryList } from '@/src/components/mypage/PointHistoryList';
import { PointStoreModal } from '@/src/components/mypage/PointStoreModal';
import { Wallet, Gift, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PointDashboardModal() {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [policies, setPolicies] = useState<Record<string, number>>({});
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setLoading(true);
      fetchBalance();
    };
    const handleClose = () => {
      setOpen(false);
    };

    window.addEventListener('open_point_modal', handleOpen);
    window.addEventListener('close_point_modal', handleClose);
    return () => {
      window.removeEventListener('open_point_modal', handleOpen);
      window.removeEventListener('close_point_modal', handleClose);
    };
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        if (data.policies) {
          setPolicies(data.policies);
        }
      }
    } catch (e) {
      console.error('포인트 잔액을 불러오지 못했습니다.', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceSuccess = (newBalance: number) => {
    setBalance(newBalance);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRedeemSuccess = (newBalance: number) => {
    setBalance(newBalance);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto bg-white border border-gray-100 text-gray-900 rounded-3xl p-5 md:p-8 scrollbar-hide">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <DialogHeader className="relative pr-8">
              <DialogTitle className="text-xl md:text-2xl font-black text-gray-900 tracking-tight w-fit">
                마이 포인트 💰
              </DialogTitle>
              <DialogDescription className="text-gray-500 text-xs md:text-sm mt-1.5 font-semibold text-left">
                다양한 커뮤니티 활동 및 출석체크를 통해 포인트를 쌓고 상품권으로 교환하세요.
              </DialogDescription>
            </DialogHeader>

            {loading ? (
              <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                <span className="text-sm text-gray-500 font-bold">포인트 대시보드를 불러오는 중...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Main Points Card (Wallet Card) */}
                <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-[2rem] p-5 md:p-7 relative overflow-hidden shadow-xl shadow-purple-900/10">
                  {/* Glow Effects */}
                  <div className="absolute top-[-30%] right-[-10%] w-64 h-64 bg-white/10 rounded-full filter blur-3xl" />
                  <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-purple-400/20 rounded-full filter blur-2xl" />

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider">
                        <Wallet className="w-4 h-4" />
                        보유 활동 포인트
                      </div>
                      <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                        {balance.toLocaleString()}<span className="text-lg md:text-xl font-black text-purple-200 ml-1">p</span>
                      </h1>
                      <p className="text-[11px] text-purple-200/80 font-medium">
                        * 최소 5,000 포인트 이상 보유 시 문화상품권 등으로 교환 신청하실 수 있습니다.
                      </p>
                    </div>

                    <Button
                      onClick={() => setIsStoreOpen(true)}
                      className="w-full md:w-auto h-12 px-7 bg-white hover:bg-purple-50 text-purple-700 font-black rounded-2xl shadow-lg transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Gift className="w-5 h-5" />
                      상품권 교환소 입장
                    </Button>
                  </div>
                </div>

                {/* Attendance Check (Full Width) */}
                <div>
                  <AttendanceCheck onAttendanceSuccess={handleAttendanceSuccess} />
                </div>

                {/* Point History List (Full Width, Table style) */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <PointHistoryList refreshTrigger={refreshTrigger} />
                </div>

                {/* Guide Info */}
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-start gap-3 text-xs leading-relaxed text-gray-500">
                  <HelpCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                  <div className="space-y-2 w-full">
                    <span className="font-bold text-gray-700 block text-[13px]">포인트 적립 및 이용 정책 안내</span>
                    <ul className="list-disc list-inside space-y-1.5 font-medium text-gray-600">
                      <li><strong>매일 출석체크</strong>: 하루 1회 <strong>+100P</strong> 즉시 적립</li>
                      <li><strong>연속 출석체크 보너스</strong>: KST 기준 <strong>3일 연속 +300P</strong> / <strong>7일 연속 +700P</strong> / <strong>15일 연속 +2,000P</strong> / <strong>30일 연속 +5,000P</strong> 추가 적립 (일일 한도 제외)</li>
                      <li><strong>커뮤니티 글 작성</strong>: <strong>+{(policies.ACTIVITY_POST_WRITE ?? 100).toLocaleString()}P</strong> 적립 (본문 <strong>5자</strong> 이상 작성 필수, 하루 최대 <strong>{policies.LIMIT_DAILY_POST_COUNT ?? 5}회</strong> 제한)</li>
                      <li><strong>커뮤니티 댓글 등록</strong>: <strong>+{(policies.ACTIVITY_COMMENT_WRITE ?? 20).toLocaleString()}P</strong> 적립 (글자수 제한 없음, 하루 최대 <strong>{policies.LIMIT_DAILY_COMMENT_COUNT ?? 10}회</strong> 제한)</li>
                      <li><strong>게시글 공감(좋아요) 획득</strong>: 내 글이 타인의 공감을 받으면 <strong>+{(policies.ACTIVITY_POST_LIKE_RECEIVED ?? 100).toLocaleString()}P</strong> 보상 적립 (공감 취소 시 즉시 회수, 본인 글 공감 제외, 일일 한도 제외)</li>
                      <li><strong>친구 추천 가입 보상</strong>: 가입 본인 <strong>+{(policies.ACTIVITY_REFERRAL_SIGNUP ?? 500).toLocaleString()}P</strong> / 나를 추천한 친구 <strong>+{(policies.ACTIVITY_REFERRAL_BONUS ?? 1000).toLocaleString()}P</strong> 적립 (일일 한도 제외)</li>
                      <li><strong>게시글 및 댓글 삭제 회수 정책</strong>: 상품권 교환 완료 시점 <strong>이후(미래)</strong>에 작성된 글/댓글 삭제 시 적립액만큼 즉시 포인트 차감 (교환 완료 이전 글은 차감 없음, 잔고 마이너스 허용)</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Store Modal (nested) */}
      <PointStoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        currentPoints={balance}
        onRedeemSuccess={handleRedeemSuccess}
      />
    </>
  );
}
