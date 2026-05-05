'use client';

import { useState, useEffect } from 'react';
import { GET_POINT_POLICIES, UPDATE_POINT_POLICIES, PointPolicyItem } from '@/app/actions/pointPolicyActions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  History, 
  Calendar, 
  Settings2, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Save,
  Trash2,
  Coins
} from 'lucide-react';
import { PolicyFormModal } from '@/components/admin/points/PolicyFormModal';
import { TierConfigEditor } from '@/components/admin/points/TierConfigEditor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const BASE_OPTIONS = [
    { key: 'OPTION_PRICE_BASE_PERIOD', title: '기본 패키지', desc: '구인광고 기본 노출 요금입니다.' },
    { key: 'OPTION_PRICE_BOLD', title: '제목 굵게', desc: '제목을 굵게 표시하여 눈에 띄게' },
    { key: 'OPTION_PRICE_COLOR', title: '글자색 변경', desc: '제목에 매력적인 브랜드 컬러 적용' },
    { key: 'OPTION_PRICE_HIGHLIGHT', title: '형광펜 효과', desc: '글씨 뒷배경을 형광펜으로 강조' },
    { key: 'OPTION_PRICE_BG', title: '배경색 변경', desc: '공고 영역 전체 배경색을 은은하게 강조' },
    { key: 'OPTION_PRICE_ICON', title: '급구/특수 아이콘', desc: '시선을 사로잡는 급구 마크' },
    { key: 'OPTION_PRICE_GENERAL_ICONS', title: '일반 아이콘', desc: '최대 2개 중복 선택 가능한 예쁜 뱃지' },
    { key: 'OPTION_PRICE_JUMP', title: '상단 끌어올리기', desc: '매일 6회 자동으로 리스트 최상단 끌어올림' },
];

function OptionCard({ baseOpt, pricingOptions, setPricingOptions }: any) {
    const val30 = pricingOptions.find((p: PointPolicyItem) => p.config_key === `${baseOpt.key}_30`)?.config_value || 0;
    const val60 = pricingOptions.find((p: PointPolicyItem) => p.config_key === `${baseOpt.key}_60`)?.config_value || 0;
    const val90 = pricingOptions.find((p: PointPolicyItem) => p.config_key === `${baseOpt.key}_90`)?.config_value || 0;

    const [percent60, setPercent60] = useState('');
    const [percent90, setPercent90] = useState('');

    const handlePriceChange = (period: number, value: number) => {
        setPricingOptions((prev: PointPolicyItem[]) => prev.map(p => p.config_key === `${baseOpt.key}_${period}` ? { ...p, config_value: value } : p));
    };

    const handlePercentChange = (period: number, percent: number) => {
        const months = period / 30;
        const calculated = Math.floor((val30 * months) * ((100 - percent) / 100) / 1000) * 1000;
        handlePriceChange(period, calculated);
    };

    return (
        <div className="p-5 border border-gray-100 rounded-2xl bg-gray-50 hover:border-primary/30 transition-all shadow-sm">
            <div className="text-[12px] font-black text-primary opacity-60 uppercase tracking-widest">{baseOpt.key}</div>
            <div className="font-bold text-[16px] text-gray-900 mt-1">{baseOpt.title}</div>
            <p className="text-[12px] text-gray-500 mt-1 mb-4 h-8">{baseOpt.desc}</p>
            
            <div className="space-y-3">
                {/* 30일 */}
                <div className="flex items-center gap-2">
                    <span className="w-10 text-[13px] font-bold text-gray-600">30일</span>
                    <input type="number" value={val30} onChange={e => handlePriceChange(30, parseInt(e.target.value) || 0)} className="flex-1 px-3 py-1.5 border-2 border-gray-200 rounded-lg text-right font-black focus:border-primary outline-none transition-colors" />
                    <span className="text-gray-400 font-black text-sm">P</span>
                </div>

                {/* 60일 */}
                <div className="flex items-center gap-2">
                    <span className="w-10 text-[13px] font-bold text-gray-600">60일</span>
                    <input type="number" placeholder="%" value={percent60} onChange={e => {
                        setPercent60(e.target.value);
                        if (e.target.value) handlePercentChange(60, parseFloat(e.target.value));
                    }} className="w-14 px-1 py-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold text-blue-600 focus:border-blue-500 outline-none bg-blue-50" />
                    <input type="number" value={val60} onChange={e => {
                        setPercent60('');
                        handlePriceChange(60, parseInt(e.target.value) || 0);
                    }} className="flex-1 px-3 py-1.5 border-2 border-gray-200 rounded-lg text-right font-black focus:border-primary outline-none transition-colors" />
                    <span className="text-gray-400 font-black text-sm">P</span>
                </div>

                {/* 90일 */}
                <div className="flex items-center gap-2">
                    <span className="w-10 text-[13px] font-bold text-gray-600">90일</span>
                    <input type="number" placeholder="%" value={percent90} onChange={e => {
                        setPercent90(e.target.value);
                        if (e.target.value) handlePercentChange(90, parseFloat(e.target.value));
                    }} className="w-14 px-1 py-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold text-blue-600 focus:border-blue-500 outline-none bg-blue-50" />
                    <input type="number" value={val90} onChange={e => {
                        setPercent90('');
                        handlePriceChange(90, parseInt(e.target.value) || 0);
                    }} className="flex-1 px-3 py-1.5 border-2 border-gray-200 rounded-lg text-right font-black focus:border-primary outline-none transition-colors" />
                    <span className="text-gray-400 font-black text-sm">P</span>
                </div>
            </div>
        </div>
    );
}

export default function AdminPointsPolicyPage() {
  const [activeMainTab, setActiveMainTab] = useState('pricing');
  const [activeTab, setActiveTab] = useState('current');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOverride, setIsOverride] = useState(false);

  // 💡 포인트 가격 상태
  const [pricingOptions, setPricingOptions] = useState<PointPolicyItem[]>([]);

  // 💡 정책 데이터 (Mock)
  const [policies, setPolicies] = useState([
    { id: '1', key: 'FIRST_CHARGE_BONUS_RATIO', value: 0.5, start: '2026-04-01 00:00', end: '9999-12-31', status: 'ACTIVE' },
    { id: '2', key: 'MAX_FIRST_CHARGE_BONUS', value: 300000, start: '2026-04-01 00:00', end: '9999-12-31', status: 'ACTIVE' },
    { id: '3', key: 'REFUND_FEE_RATIO', value: 0.1, start: '2026-04-01 00:00', end: '9999-12-31', status: 'ACTIVE' },
    { id: '4', key: 'TIER_VIP_BONUS_RATIO', value: 0.15, start: '2026-06-01 09:00', end: '9999-12-31', status: 'UPCOMING' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await GET_POINT_POLICIES();
      if (res.success && res.data) {
        setPricingOptions(res.data.filter(p => p.config_key.startsWith('OPTION_PRICE_')));
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleSavePricing = async () => {
    setIsLoading(true);
    const res = await UPDATE_POINT_POLICIES(pricingOptions.map(p => ({
      config_key: p.config_key,
      config_value: p.config_value
    })));
    if (res.success) {
      alert('저장되었습니다.');
    } else {
      alert('오류가 발생했습니다.');
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Settings2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-bold text-lg">포인트 및 정책 데이터를 불러오는 중입니다... 🦊</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* 🚀 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight">전역 포인트 및 정책 관리</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">통합 마스터</Badge>
          </div>
          <p className="text-muted-foreground font-medium">유료 옵션 가격, 보너스 비율, 환불 수수료 및 등급 기준을 실시간으로 제어합니다. 🦊</p>
        </div>
      </div>

      <Tabs defaultValue="pricing" className="w-full" onValueChange={setActiveMainTab}>
        {/* Main Tabs Navigation */}
        <div className="bg-white p-2 rounded-2xl border shadow-sm mb-6 inline-block">
          <TabsList className="bg-transparent gap-2 h-auto">
            <TabsTrigger 
              value="pricing" 
              className="px-6 py-3 rounded-xl font-black text-[15px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              유료 옵션 가격 설정
            </TabsTrigger>
            <TabsTrigger 
              value="policy" 
              className="px-6 py-3 rounded-xl font-black text-[15px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              보너스/환불 정책
            </TabsTrigger>
            <TabsTrigger 
              value="tier" 
              className="px-6 py-3 rounded-xl font-black text-[15px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              업체 등급 기준
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 탭 1: 유료 옵션 가격 설정 */}
        <TabsContent value="pricing" className="mt-0">
          <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Coins className="text-primary h-6 w-6" />
                  유료 광고 옵션 가격표
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">구인광고 등록 시 차감되는 옵션별 기본 포인트를 설정합니다.</p>
              </div>
              <Button onClick={handleSavePricing} disabled={isLoading} className="font-bold gap-2"><Save className="w-4 h-4" /> 일괄 저장</Button>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 mt-6">
              {BASE_OPTIONS.map(baseOpt => (
                <OptionCard 
                  key={baseOpt.key} 
                  baseOpt={baseOpt} 
                  pricingOptions={pricingOptions} 
                  setPricingOptions={setPricingOptions} 
                />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* 탭 2: 보너스/환불 정책 */}
        <TabsContent value="policy" className="mt-0 space-y-8">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Settings2 className="text-primary h-6 w-6" />
                  글로벌 정책 타임라인
                </h2>
                <Button onClick={() => setIsModalOpen(true)} className="font-bold h-10 px-4" size="sm">
                  <Plus className="mr-2 h-4 w-4" /> 신규 정책 예약
                </Button>
              </div>
              
              <Tabs defaultValue="current" className="w-full" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border mb-6 shadow-sm">
                  <TabsList className="bg-gray-100 p-1 rounded-xl">
                    <TabsTrigger value="current" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">현재 작동 중</TabsTrigger>
                    <TabsTrigger value="upcoming" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">예약 대기</TabsTrigger>
                    <TabsTrigger value="history" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">종료된 이력</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-bold">
                    <Clock className="h-4 w-4" />
                    최종 갱신: 2026-03-31 01:47
                  </div>
                </div>

                <TabsContent value="current" className="space-y-4">
                  {policies.filter(p => p.status === 'ACTIVE').map(policy => (
                    <Card key={policy.id} className="border-2 hover:border-primary/30 transition-all group shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-[12px] font-black text-primary opacity-60 uppercase tracking-widest">{policy.key}</div>
                            <div className="text-2xl font-black">{typeof policy.value === 'number' && policy.value < 1 ? (policy.value * 100) + '%' : policy.value.toLocaleString() + (policy.key.includes('MAX') ? ' P' : '')}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right space-y-0.5">
                              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">적용 시작일</div>
                              <div className="text-[12px] font-black text-gray-700">{policy.start}</div>
                            </div>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 font-black">실행 중</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4">
                  {policies.filter(p => p.status === 'UPCOMING').map(policy => (
                    <Card key={policy.id} className="border-2 border-dashed border-primary/20 bg-primary/5 shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-[12px] font-black text-primary opacity-60 uppercase tracking-widest">{policy.key}</div>
                            <div className="text-2xl font-black">{typeof policy.value === 'number' && policy.value < 1 ? (policy.value * 100) + '%' : policy.value.toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right space-y-0.5">
                              <div className="text-[10px] text-orange-500 font-bold uppercase tracking-tighter italic">예약된 시작 시간</div>
                              <div className="text-[12px] font-black text-orange-600">{policy.start}</div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50"><Settings2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            <aside className="lg:col-span-4 space-y-8 mt-14">
              <Card className="bg-gray-900 text-white p-6 border-0 shadow-2xl rounded-3xl relative overflow-hidden">
                 <div className="relative z-10 space-y-6">
                   <div className="flex items-center gap-2">
                     <ShieldCheck className="text-primary h-6 w-6" />
                     <h2 className="text-xl font-black">긴급 정책 제어</h2>
                   </div>
                   
                   <Alert className="bg-white/10 border-white/20 text-white py-4">
                     <AlertTriangle className="h-4 w-4 text-yellow-400" />
                     <AlertDescription className="text-[12px] font-medium leading-relaxed opacity-90">
                       정책 등록 시 **'즉시 적용'**을 선택하면 현재 작동 중인 모든 이전 정책의 종료 시점이 즉각 단축됩니다. 🦊
                     </AlertDescription>
                   </Alert>

                   <div className="space-y-4">
                      <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10">
                        <Checkbox 
                          id="override-control" 
                          checked={isOverride}
                          onCheckedChange={(checked: boolean) => setIsOverride(checked)}
                          className="border-white/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                        />
                        <label htmlFor="override-control" className="text-[13px] font-bold cursor-pointer">신규 정책 등록 시 즉시 교체 옵션 활성화</label>
                      </div>
                      <p className="text-[11px] text-gray-400 px-2 italic">이 옵션은 미래 예약 정책보다 우선하여 현재 시스템에 즉각 반영됩니다.</p>
                   </div>
                 </div>
                 <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
              </Card>

              <Card className="border-2 border-primary/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> 가이드
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <ul className="space-y-3 text-[12px] font-medium text-muted-foreground list-disc list-inside">
                     <li>정책 종료일(`end_at`)은 기본적으로 **9999-12-31**로 설정됩니다.</li>
                     <li>미래 정책이 예약되면 기존 정책은 예약된 시작 시간 1초 전에 자동 종료됩니다.</li>
                     <li>이력(`History`) 탭의 데이터는 삭제할 수 없습니다.</li>
                   </ul>
                </CardContent>
              </Card>
            </aside>
          </div>
        </TabsContent>

        {/* 탭 3: 업체 등급 기준 */}
        <TabsContent value="tier" className="mt-0">
          <section className="bg-white p-8 rounded-3xl border shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Settings2 className="h-6 w-6 text-primary" /> 업체 등급 및 승급 요건 설정
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">
                  결제 금액 및 유지 기간에 따른 자동 승급 기준을 정의합니다.
                </p>
              </div>
            </div>
            <TierConfigEditor />
          </section>
        </TabsContent>
      </Tabs>

      {/* 🚀 정책 등록 모달 연동 */}
      <PolicyFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(policy) => {
          console.log('New policy saved:', policy);
        }}
      />
    </div>
  );
}
