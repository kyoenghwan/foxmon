'use client';

import { useState, useEffect } from 'react';
import { PointStatusCard } from '@/components/employer/point-status-card';
import { RefundSimulator } from '@/components/employer/refund-simulator';
import { RefundRequestModal } from '@/components/employer/refund-request-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Wallet, History, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

/**
 * [Page] EmployerPointsPage
 * 사장님(업체 회원) 전용 포인트 및 환불 관리 메인 대시보드입니다.
 * 실시간 가치 정산 로직이 적용된 시뮬레이터와 잔액 정보를 통합 제공합니다.
 */
export default function EmployerPointsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 💡 실시간 유저 포인트 정보 (Mock Data for UI Integration)
  const [userData, setUserData] = useState({
    userId: 'mock-user-123',
    paidPoints: 100000,
    bonusPoints: 50000,
    tier: 'VIP',
    bonusRatio: 0.1, // 10% 추가 적립 중
  });

  useEffect(() => {
    // 💡 실제 DB 연동 지점: QA_GET_USER_POINTS_SUMMARY 등 호출
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-muted-foreground animate-pulse font-bold text-lg">포인트 정보를 불러오는 중입니다... 🦊</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 pb-12 overflow-hidden">
      {/* 🚀 1. 상단 등급 혜택 홍보 배너 (사장님용) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-md">
              사장님 전용 특별 혜택
            </Badge>
            <h1 className="text-3xl font-black md:text-4xl">연속 광고 등록 시 <span className="text-yellow-300">최대 30%</span> 보너스!</h1>
            <p className="opacity-90 font-medium">등급이 올라갈수록 사장님의 광고 효과와 혜택은 더욱 강력해집니다. 🦊</p>
          </div>
          <div className="flex -space-x-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30">VIP</div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30">VVIP</div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-red-600 font-bold border-2 border-white shadow-lg">VVVIP</div>
          </div>
        </div>
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 h-full w-1/3 bg-white/10 skew-x-[-20deg] translate-x-20"></div>
        <div className="absolute top-0 right-0 h-full w-1/4 bg-white/5 skew-x-[-20deg] translate-x-32"></div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-8">
          {/* 💰 2. 실시간 포인트 및 등급 요약 위젯 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold tracking-tight">내 포인트 현황</h2>
            </div>
            <PointStatusCard 
              paidPoints={userData.paidPoints}
              bonusPoints={userData.bonusPoints}
              tier={userData.tier}
              bonusRatio={userData.bonusRatio}
            />
          </section>

          <Separator />

          {/* 📜 3. 최근 포인트 이용 내역 (간략) */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold tracking-tight">최근 이용 내역</h2>
              </div>
              <button className="text-sm text-muted-foreground hover:underline">전체 보기</button>
            </div>
            <Card className="border-2 border-muted/50">
              <CardContent className="p-0">
                <div className="divide-y text-sm">
                  {[
                    { id: 1, type: '충전', date: '2026-03-31', amount: '+150,000 P', desc: 'VIP 등급 10% 보너스 포함', color: 'text-blue-600' },
                    { id: 2, type: '사용', date: '2026-03-30', amount: '-20,000 P', desc: '프리미엄 광고 (강남구 논현동) 등록', color: 'text-red-500' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <div className="font-bold flex items-center gap-2">
                          <Badge variant={item.type === '충전' ? 'default' : 'secondary'}>{item.type}</Badge>
                          <span>{item.desc}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{item.date}</div>
                      </div>
                      <div className={`font-black text-lg ${item.color}`}>
                        {item.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* ⚛️ 4. 실시간 환불 시뮬레이터 사이드바 */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-bold tracking-tight">B2B 환불 신청</h2>
          </div>
          <RefundSimulator userId={userData.userId} />
          
          <Card className="bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-yellow-800 dark:text-yellow-400">
                <Info className="h-4 w-4" />
                <span className="text-sm">B2B 정산 정책 안내</span>
              </div>
              <ul className="list-disc list-outside ml-4 text-[11px] text-yellow-700/80 dark:text-yellow-300/80 space-y-1">
                <li>환불은 입금 원금의 가치를 기준으로 배수 정산됩니다.</li>
                <li>마케팅 용도로 지급된 보너스 포인트는 현금 환불 대상이 아닙니다.</li>
                <li>**환불 신청 접수 후 영업일 기준 3일 이내** 등록하신 계좌로 입금됩니다.</li>
                <li>폐업 및 업종 변경 시에도 동일한 원칙이 적용됩니다.</li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* 5. 환불 신청 모달 제어 */}
      <RefundRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        refundAmount={40000} // Simulation result
      />
    </div>
  );
}
