'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, Save, TrendingUp, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TierConfig {
  tier_name: string;
  min_months: number;
  min_spend: number;
  bonus_ratio: number;
}

/**
 * [Admin Component] TierConfigEditor
 * 업체 등급(VIP, VVIP, VVVIP)별 승급 기준 및 혜택을 실시간으로 수정하는 관리자 도구입니다.
 */
export function TierConfigEditor() {
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>([
    { tier_name: 'NORMAL', min_months: 0, min_spend: 0, bonus_ratio: 0 },
    { tier_name: 'VIP', min_months: 3, min_spend: 300000, bonus_ratio: 0.1 },
    { tier_name: 'VVIP', min_months: 6, min_spend: 1000000, bonus_ratio: 0.2 },
    { tier_name: 'VVVIP', min_months: 12, min_spend: 2000000, bonus_ratio: 0.3 },
  ]);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleValueChange = (index: number, field: keyof TierConfig, value: string) => {
    const newConfigs = [...tierConfigs];
    (newConfigs[index] as any)[field] = field === 'bonus_ratio' ? parseFloat(value) : parseInt(value);
    setTierConfigs(newConfigs);
  };

  const handleSave = async () => {
    setIsUpdating(true);
    // 💡 OA_UPDATE_TIER_CONFIGS 연동 지점
    setTimeout(() => {
      setIsUpdating(false);
      alert('등급 정책이 성공적으로 업데이트되었습니다. 🦊');
    }, 1000);
  };

  return (
    <Card className="border-2 shadow-sm overflow-hidden">
      <CardHeader className="bg-gray-50/50 dark:bg-gray-950/30 border-b pb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2 tracking-tight">
              <Crown className="h-5 w-5 text-yellow-500" />
              업체 등급 기준 설정
            </CardTitle>
            <CardDescription>연속 유지 기간 및 누적 결제액에 따른 등급 자동 승급 기준 관리</CardDescription>
          </div>
          <Button onClick={handleSave} disabled={isUpdating} className="font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            {isUpdating ? '저장 중...' : '최종 설정 저장'}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-[11px] font-black uppercase text-muted-foreground border-b italic">
              <tr>
                <th className="px-6 py-4">등급명</th>
                <th className="px-6 py-4 flex items-center gap-1">최소 유지 기간 <TrendingUp className="h-3 w-3" /></th>
                <th className="px-6 py-4">최소 누적 결제액 (원)</th>
                <th className="px-6 py-4">보너스 적립율 (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tierConfigs.map((tier, idx) => (
                <tr key={tier.tier_name} className={idx === 0 ? "bg-muted/10 opacity-60" : "hover:bg-muted/20 transition-colors"}>
                  <td className="px-6 py-4 font-black">{tier.tier_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={tier.min_months} 
                        onChange={(e) => handleValueChange(idx, 'min_months', e.target.value)}
                        disabled={idx === 0}
                        className="w-20 font-bold"
                      />
                      <span className="text-muted-foreground font-medium">개월</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={tier.min_spend}
                        onChange={(e) => handleValueChange(idx, 'min_spend', e.target.value)}
                        disabled={idx === 0}
                        className="w-40 font-bold"
                      />
                      <span className="text-muted-foreground font-medium">원 이상</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        step="0.01"
                        value={tier.bonus_ratio}
                        onChange={(e) => handleValueChange(idx, 'bonus_ratio', e.target.value)}
                        disabled={idx === 0}
                        className="w-24 font-bold text-primary"
                      />
                      <span className="text-primary font-black">({Math.round(tier.bonus_ratio * 100)}%)</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-blue-50/30 dark:bg-blue-950/10 border-t">
          <Alert variant="default" className="border-blue-200/50 bg-transparent py-2">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-xs text-blue-700/80 dark:text-blue-400/80 font-medium leading-relaxed italic">
              등급 기준을 변경하면 즉시 현재 모든 업체의 실시간 등급 산정에 반영됩니다. 🦊<br />
              누적 결제액은 취소 및 환불분을 제외한 순수 입금 원금의 합계입니다.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
