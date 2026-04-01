'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Crown, ArrowUpCircle } from 'lucide-react';

interface PointStatusProps {
  paidPoints: number;
  bonusPoints: number;
  tier: string;
  bonusRatio: number;
}

/**
 * [Component] PointStatusCard
 * 사장님의 현재 포인트 잔액(유료/보너스)과 업체 등급 및 혜택 정보를 시각화합니다.
 */
export function PointStatusCard({ paidPoints, bonusPoints, tier, bonusRatio }: PointStatusProps) {
  const totalPoints = paidPoints + bonusPoints;
  const bonusPercent = Math.round(bonusRatio * 100);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. 총 보유 포인트 카드 */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-orange-50 dark:from-slate-950 dark:to-orange-950/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold opacity-70">보유 포인트</CardTitle>
          <Coins className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-orange-600 dark:text-orange-400">
            {totalPoints.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">P</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t pt-3">
            <div className="flex flex-col">
              <span className="text-muted-foreground">유료 포인트 (환불 가능)</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{paidPoints.toLocaleString()} P</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground">보너스 포인트 (환불 불가)</span>
              <span className="font-bold text-pink-500">{bonusPoints.toLocaleString()} P</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. 현재 업체 등급 카드 */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold opacity-70">업체 등급</CardTitle>
          <Crown className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black">{tier}</div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
              {bonusPercent}% 추가 적립
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            연속 유지 기간과 누적 결제액에 따라 등급이 결정됩니다.<br />
            현재 사장님은 정가 대비 **{bonusPercent}% 더 많은 혜택**을 받고 계십니다.
          </p>
        </CardContent>
      </Card>

      {/* 3. 혜택 안내 (Quick Action) */}
      <Card className="border-dashed border-2 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold opacity-70">다음 등급 혜택 안내</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-between h-[100px]">
          <p className="text-xs text-muted-foreground italic">
            "지속적인 공고 등록은 사장님의 등급을 높여줍니다.<br />
            VVIP 등급 달성 시 20% 보너스가 즉시 적용됩니다!"
          </p>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              <ArrowUpCircle className="h-3 w-3" /> 등급 혜택 자세히 보기
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
