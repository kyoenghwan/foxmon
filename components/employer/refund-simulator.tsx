'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle, Calculator, Info, Landmark } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RefundSimulationData {
  success: boolean;
  totalRefundAmount: number;
  refundFee: number;
  totalRemainingValue: number;
  reason: string;
  details: any[];
}

/**
 * [Component] RefundSimulator
 * 관리자 정의 B2B 공식 기반 실시간 환불액 시뮬레이터 위젯입니다.
 */
export function RefundSimulator({ userId }: { userId: string }) {
  const [data, setData] = useState<RefundSimulationData | null>(null);
  const [loading, setLoading] = useState(true);

  // 💡 실시간 환불 정보 조회 (이후 Server Action 연동 필요)
  useEffect(() => {
    // Mock simulation for initial UI check
    setTimeout(() => {
      setData({
        success: true,
        totalRefundAmount: 40000,
        refundFee: 10000,
        totalRemainingValue: 50000,
        reason: "10만 원 충전(15만P) 후 7.5만P 사용 시: 10만 - (7.5만/1.5) - 1만(수수료) = 4만 원",
        details: []
      });
      setLoading(false);
    }, 800);
  }, [userId]);

  if (loading) {
    return (
      <Card className="animate-pulse border-2">
        <div className="h-[200px] bg-muted/50 rounded-lg"></div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-red-100 dark:border-red-900/30 overflow-hidden">
      <CardHeader className="bg-red-50/50 dark:bg-red-950/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-red-500" />
              실시간 환불 예상액
            </CardTitle>
            <CardDescription>B2B 공식 기반 중도 해지 정산 결과</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] p-3">
                <p className="text-xs leading-relaxed font-semibold mb-1">[환불 공통 규정]</p>
                <p className="text-xs leading-relaxed opacity-80 italic">
                  실제 입금 원금에서 보너스 포인트 가치를 제외한 실사용액과 시스템 운영 수수료 10%를 차감한 금액입니다.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4 pb-6">
          <div className="text-4xl font-black text-red-600 dark:text-red-500">
            {data?.totalRefundAmount.toLocaleString()} <span className="text-xl font-normal text-muted-foreground">원</span>
          </div>
          <p className="text-xs text-muted-foreground bg-muted p-2 rounded text-center leading-relaxed">
            {data?.reason}
          </p>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">정산 대상 원금 가치</span>
            <span className="font-semibold">{data?.totalRemainingValue.toLocaleString()} 원</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">시스템 운영 수수료 (원금 10%)</span>
            <span className="font-semibold text-red-500">- {data?.refundFee.toLocaleString()} 원</span>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-sm font-bold text-blue-800 dark:text-blue-400">안내 사항</AlertTitle>
            <AlertDescription className="text-xs text-blue-700/80 dark:text-blue-300/80">
              환불 신청 시 보유한 모든 보너스 포인트는 즉시 소멸됩니다.<br />
              **접수 후 영업일 기준 3일 이내**에 등록하신 계좌로 입금됩니다.
            </AlertDescription>
          </Alert>

          <Button className="w-full font-bold h-12 bg-gray-900 hover:bg-black text-white dark:bg-red-600 dark:hover:bg-red-700" size="lg">
            <Landmark className="mr-2 h-4 w-4" /> 포인트 환불 신청하기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
