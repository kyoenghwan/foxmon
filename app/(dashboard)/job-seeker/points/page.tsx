'use client';

import { useState, useEffect } from 'react';
import { AttendanceCheck } from '@/src/components/mypage/AttendanceCheck';
import { PointHistoryList } from '@/src/components/mypage/PointHistoryList';
import { PointStoreModal } from '@/src/components/mypage/PointStoreModal';
import { Wallet, Gift, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function JobSeekerPointsPage() {
  const [balance, setBalance] = useState<number>(0);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/user/balance');
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
      }
    } catch (e) {
      console.error('포인트 잔액을 불러오지 못했습니다.', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [refreshTrigger]);

  const handleAttendanceSuccess = (newBalance: number) => {
    setBalance(newBalance);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRedeemSuccess = (newBalance: number) => {
    setBalance(newBalance);
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <span className="text-sm text-gray-500 font-bold">포인트 대시보드를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-2 animate-in fade-in duration-500">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">마이 포인트</h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            다양한 커뮤니티 활동 및 출석체크를 통해 포인트를 쌓고 상품권으로 교환하세요.
          </p>
        </div>
      </div>
      
      <Separator className="bg-gray-100" />

      {/* Main Points Card (Wallet Card) */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden shadow-xl shadow-purple-900/10">
        {/* Glow Effects */}
        <div className="absolute top-[-30%] right-[-10%] w-64 h-64 bg-white/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-purple-400/20 rounded-full filter blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              보유 활동 포인트
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              {balance.toLocaleString()}<span className="text-lg md:text-2xl font-black text-purple-200 ml-1">p</span>
            </h1>
            <p className="text-[11px] text-purple-200/80 font-medium">
              * 최소 5,000 포인트 이상 보유 시 문화상품권 등으로 교환 신청하실 수 있습니다.
            </p>
          </div>

          <Button
            onClick={() => setIsStoreOpen(true)}
            className="w-full md:w-auto h-13 px-8 bg-white hover:bg-purple-50 text-purple-700 font-black rounded-2xl shadow-lg transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            <Gift className="w-5 h-5" />
            상품권 교환소 입장
          </Button>
        </div>
      </div>

      {/* Split Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Attendance (Left/Center) */}
        <div className="lg:col-span-2">
          <AttendanceCheck onAttendanceSuccess={handleAttendanceSuccess} />
        </div>

        {/* History (Right) */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xl">
            <PointHistoryList refreshTrigger={refreshTrigger} />
          </div>
        </div>

      </div>

      {/* Guide Info */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-start gap-3 text-xs leading-relaxed text-gray-500">
        <HelpCircle className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-gray-700">포인트 적립 안내</span>
          <ul className="list-disc list-inside space-y-0.5 font-medium mt-1">
            <li>매일 출석체크: +100 포인트 (일 1회)</li>
            <li>커뮤니티 새 글 등록: +50 포인트 (일 최대 5회 적립)</li>
            <li>커뮤니티 댓글 등록: +10 포인트 (일 최대 10회 적립)</li>
            <li>추천인 코드 등록 가입: 가입자 +500 포인트 / 추천인 +1,000 포인트</li>
          </ul>
        </div>
      </div>

      {/* Store Modal */}
      <PointStoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        currentPoints={balance}
        onRedeemSuccess={handleRedeemSuccess}
      />

    </div>
  );
}
