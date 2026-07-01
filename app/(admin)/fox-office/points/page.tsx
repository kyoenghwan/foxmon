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
    { key: 'OPTION_PRICE_JUMP', title: '스마트 자동 점프 (Auto Jump)', desc: '구인공고가 밀려나면 자동으로 리스트 최상단 끌어올림' },
];

const OTHER_TIER_OPTIONS = [
    { key: 'TIER_PRICE_PREMIUM', title: '💎 프리미엄 배너', desc: '본문 최상단 테마 강조 노출' },
    { key: 'TIER_PRICE_SPECIAL', title: '⭐ 스페셜 배너', desc: '프리미엄 하단 우선 노출' },
    { key: 'TIER_PRICE_GENERAL', title: '📋 일반 배너', desc: '기본 리스트 노출' },
    { key: 'TIER_PRICE_AD_GENERAL', title: '💼 배너 (일반)', desc: '배너 카테고리 일반 노출 요금' }
];

function SingleConfigCard({ configKey, title, desc, unit, pricingOptions, setPricingOptions }: any) {
    const val = pricingOptions.find((p: PointPolicyItem) => p.config_key === configKey)?.config_value || 0;

    const handleValueChange = (value: number) => {
        setPricingOptions((prev: PointPolicyItem[]) => prev.map(p => p.config_key === configKey ? { ...p, config_value: value } : p));
    };

    return (
        <div className="p-5 border border-amber-100 rounded-2xl bg-amber-50/20 hover:border-amber-300 transition-all shadow-sm">
            <div className="text-[12px] font-black text-amber-600 opacity-80 uppercase tracking-widest">{configKey}</div>
            <div className="font-bold text-[16px] text-gray-900 mt-1">{title}</div>
            <p className="text-[12px] text-gray-500 mt-1 mb-4 h-8">{desc}</p>
            
            <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-600 whitespace-nowrap">설정값</span>
                <input type="number" value={val} onChange={e => handleValueChange(parseInt(e.target.value) || 0)} className="flex-1 min-w-0 px-3 py-2 border-2 border-amber-200 rounded-lg text-right font-black text-lg focus:border-amber-500 outline-none transition-colors" />
                <span className="text-gray-400 font-black text-sm shrink-0">{unit}</span>
            </div>
        </div>
    );
}

function CombinedActivityCard({ 
    title, 
    desc, 
    configKeyAmt, 
    titleAmt, 
    unitAmt, 
    configKeyLimit, 
    titleLimit, 
    unitLimit, 
    pricingOptions, 
    setPricingOptions 
}: any) {
    const valAmt = pricingOptions.find((p: PointPolicyItem) => p.config_key === configKeyAmt)?.config_value || 0;
    const valLimit = pricingOptions.find((p: PointPolicyItem) => p.config_key === configKeyLimit)?.config_value || 0;

    const handleAmtChange = (value: number) => {
        setPricingOptions((prev: PointPolicyItem[]) => 
            prev.map(p => p.config_key === configKeyAmt ? { ...p, config_value: value } : p)
        );
    };

    const handleLimitChange = (value: number) => {
        setPricingOptions((prev: PointPolicyItem[]) => 
            prev.map(p => p.config_key === configKeyLimit ? { ...p, config_value: value } : p)
        );
    };

    return (
        <div className="p-5 border border-amber-100 rounded-2xl bg-amber-50/20 hover:border-amber-300 transition-all shadow-sm flex flex-col justify-between">
            <div>
                <div className="text-[12px] font-black text-amber-600 opacity-80 uppercase tracking-widest">
                    {configKeyAmt} / {configKeyLimit}
                </div>
                <div className="font-bold text-[16px] text-gray-900 mt-1">{title}</div>
                <p className="text-[12px] text-gray-500 mt-1 mb-4 h-8">{desc}</p>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-amber-100/50 mt-4">
                {/* 작성 보상 */}
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-600 w-24 shrink-0">{titleAmt}</span>
                    <input 
                        type="number" 
                        value={valAmt} 
                        onChange={e => handleAmtChange(parseInt(e.target.value) || 0)} 
                        className="flex-1 min-w-0 px-3 py-2 border-2 border-amber-200 rounded-lg text-right font-black text-lg focus:border-amber-500 outline-none transition-colors" 
                    />
                    <span className="text-gray-400 font-black text-sm shrink-0 w-6 text-center">{unitAmt}</span>
                </div>
                
                {/* 하루 최대 횟수 */}
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-600 w-24 shrink-0">{titleLimit}</span>
                    <input 
                        type="number" 
                        value={valLimit} 
                        onChange={e => handleLimitChange(parseInt(e.target.value) || 0)} 
                        className="flex-1 min-w-0 px-3 py-2 border-2 border-amber-200 rounded-lg text-right font-black text-lg focus:border-amber-500 outline-none transition-colors" 
                    />
                    <span className="text-gray-400 font-black text-sm shrink-0 w-6 text-center">{unitLimit}</span>
                </div>
            </div>
        </div>
    );
}

function OptionCard({ baseOpt, pricingOptions, setPricingOptions }: any) {
    const val30 = pricingOptions.find((p: PointPolicyItem) => p.config_key === `${baseOpt.key}_30`)?.config_value || 0;
    const val60 = pricingOptions.find((p: PointPolicyItem) => p.config_key === `${baseOpt.key}_60`)?.config_value || 0;
    const val90 = pricingOptions.find((p: PointPolicyItem) => p.config_key === `${baseOpt.key}_90`)?.config_value || 0;

    const [percent60, setPercent60] = useState('');
    const [percent90, setPercent90] = useState('');
    const [isFocused60, setIsFocused60] = useState(false);
    const [isFocused90, setIsFocused90] = useState(false);

    const getCalculatedPercent = (period: number, valPeriod: number, val30Price: number) => {
        if (val30Price <= 0 || valPeriod <= 0) return '';
        const months = period / 30;
        const originalPrice = val30Price * months;
        const discountRatio = ((originalPrice - valPeriod) / originalPrice) * 100;
        const rounded = Math.round(discountRatio * 10) / 10;
        return rounded > 0 ? rounded.toString() : '';
    };

    const displayPercent60 = isFocused60 ? percent60 : getCalculatedPercent(60, val60, val30);
    const displayPercent90 = isFocused90 ? percent90 : getCalculatedPercent(90, val90, val30);

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
                <div className="flex items-center gap-1.5">
                    <span className="w-9 shrink-0 text-[13px] font-bold text-gray-600">30일</span>
                    <div className="w-[50px] shrink-0" />
                    <input type="number" value={val30} onChange={e => handlePriceChange(30, parseInt(e.target.value) || 0)} className="flex-1 min-w-0 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-right font-black focus:border-primary outline-none transition-colors" />
                    <span className="text-gray-400 shrink-0 font-black text-sm">P</span>
                </div>

                {/* 60일 */}
                <div className="flex items-center gap-1.5">
                    <span className="w-9 shrink-0 text-[13px] font-bold text-gray-600">60일</span>
                    <input 
                        type="number" 
                        placeholder="%" 
                        value={displayPercent60} 
                        onFocus={() => {
                            setIsFocused60(true);
                            setPercent60(getCalculatedPercent(60, val60, val30));
                        }}
                        onBlur={() => setIsFocused60(false)}
                        onChange={e => {
                            setPercent60(e.target.value);
                            if (e.target.value) handlePercentChange(60, parseFloat(e.target.value));
                        }} 
                        className="w-[50px] shrink-0 px-1 py-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold text-blue-600 focus:border-blue-500 outline-none bg-blue-50" 
                    />
                    <input type="number" value={val60} onChange={e => {
                        setPercent60('');
                        handlePriceChange(60, parseInt(e.target.value) || 0);
                    }} className="flex-1 min-w-0 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-right font-black focus:border-primary outline-none transition-colors" />
                    <span className="text-gray-400 shrink-0 font-black text-sm">P</span>
                </div>

                {/* 90일 */}
                <div className="flex items-center gap-1.5">
                    <span className="w-9 shrink-0 text-[13px] font-bold text-gray-600">90일</span>
                    <input 
                        type="number" 
                        placeholder="%" 
                        value={displayPercent90} 
                        onFocus={() => {
                            setIsFocused90(true);
                            setPercent90(getCalculatedPercent(90, val90, val30));
                        }}
                        onBlur={() => setIsFocused90(false)}
                        onChange={e => {
                            setPercent90(e.target.value);
                            if (e.target.value) handlePercentChange(90, parseFloat(e.target.value));
                        }} 
                        className="w-[50px] shrink-0 px-1 py-1.5 border border-gray-200 rounded-lg text-center text-sm font-bold text-blue-600 focus:border-blue-500 outline-none bg-blue-50" 
                    />
                    <input type="number" value={val90} onChange={e => {
                        setPercent90('');
                        handlePriceChange(90, parseInt(e.target.value) || 0);
                    }} className="flex-1 min-w-0 px-2 py-1.5 border-2 border-gray-200 rounded-lg text-right font-black focus:border-primary outline-none transition-colors" />
                    <span className="text-gray-400 shrink-0 font-black text-sm">P</span>
                </div>
            </div>
        </div>
    );
}

function TierCard({ tierOpt, pricingOptions, setPricingOptions }: any) {
    const val = pricingOptions.find((p: PointPolicyItem) => p.config_key === tierOpt.key)?.config_value || 0;

    const handlePriceChange = (value: number) => {
        setPricingOptions((prev: PointPolicyItem[]) => prev.map(p => p.config_key === tierOpt.key ? { ...p, config_value: value } : p));
    };

    return (
        <div className="p-5 border border-indigo-100 rounded-2xl bg-indigo-50/30 hover:border-indigo-300 transition-all shadow-sm">
            <div className="text-[12px] font-black text-indigo-500 opacity-80 uppercase tracking-widest">{tierOpt.key}</div>
            <div className="font-bold text-[16px] text-gray-900 mt-1">{tierOpt.title}</div>
            <p className="text-[12px] text-gray-500 mt-1 mb-4 h-8">{tierOpt.desc}</p>
            
            <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-gray-600 whitespace-nowrap">단일 요금</span>
                <input type="number" value={val} onChange={e => handlePriceChange(parseInt(e.target.value) || 0)} className="flex-1 min-w-0 px-3 py-2 border-2 border-indigo-200 rounded-lg text-right font-black text-lg focus:border-indigo-500 outline-none transition-colors" />
                <span className="text-gray-400 font-black text-sm shrink-0">P</span>
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
        setPricingOptions(res.data.filter(p => 
          p.config_key.startsWith('OPTION_PRICE_') || 
          p.config_key.startsWith('TIER_PRICE_') ||
          p.config_key.startsWith('LIMIT_') ||
          p.config_key.startsWith('DISCOUNT_') ||
          p.config_key.startsWith('ACTIVITY_')
        ));
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleSavePricing = async () => {
    setIsLoading(true);
    const res = await UPDATE_POINT_POLICIES(pricingOptions);
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
            <TabsTrigger 
              value="activity" 
              className="px-6 py-3 rounded-xl font-black text-[15px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              활동/추천 포인트 정책
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
                  유료 광고 및 옵션 포인트 요금표
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">플랫폼 내 구인공고 및 배너별 노출 요금, 추가 구좌 제한을 세부적으로 관리합니다.</p>
              </div>
              <Button onClick={handleSavePricing} disabled={isLoading} className="font-bold gap-2"><Save className="w-4 h-4" /> 일괄 저장</Button>
            </div>
            
            <Tabs defaultValue="job_ad" className="w-full">
              <div className="bg-gray-100/60 p-1.5 rounded-xl border mb-6 inline-block">
                <TabsList className="bg-transparent gap-1 h-auto">
                  <TabsTrigger value="job_ad" className="px-4 py-2 rounded-lg font-bold text-[13px] data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                    📋 일반 구인공고
                  </TabsTrigger>
                  <TabsTrigger value="premium_main_ad" className="px-4 py-2 rounded-lg font-bold text-[13px] data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                    👑 프리미엄 메인
                  </TabsTrigger>
                  <TabsTrigger value="side_ad" className="px-4 py-2 rounded-lg font-bold text-[13px] data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                    🚀 사이드 배너
                  </TabsTrigger>
                  <TabsTrigger value="other_ads" className="px-4 py-2 rounded-lg font-bold text-[13px] data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm">
                    💎 기타 배너들
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* 서브탭 1: 일반 구인공고 */}
              <TabsContent value="job_ad" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {BASE_OPTIONS.map(baseOpt => (
                    <OptionCard 
                      key={baseOpt.key} 
                      baseOpt={baseOpt} 
                      pricingOptions={pricingOptions} 
                      setPricingOptions={setPricingOptions} 
                    />
                  ))}
                </div>
              </TabsContent>

              {/* 서브탭 2: 프리미엄 메인 배너 */}
              <TabsContent value="premium_main_ad" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {/* 최대 구좌수 설정 */}
                  <SingleConfigCard
                    configKey="LIMIT_PREMIUM_MAIN_SLOTS"
                    title="최대 구좌수 (슬롯 제한)"
                    desc="프리미엄 메인 배너 영역에 등록 가능한 최대 광고 구좌의 수입니다."
                    unit="구좌"
                    pricingOptions={pricingOptions}
                    setPricingOptions={setPricingOptions}
                  />
                  {/* 프리미엄 메인 기본요금 (30/60/90일) */}
                  <OptionCard 
                    baseOpt={{ key: 'TIER_PRICE_PREMIUM_MAIN', title: '프리미엄 메인 기본 요금', desc: '프리미엄 메인 배너의 기본 노출 포인트 가격입니다.' }}
                    pricingOptions={pricingOptions} 
                    setPricingOptions={setPricingOptions} 
                  />
                  {/* 스페셜 테마 이펙트 요금 */}
                  <OptionCard 
                    baseOpt={{ key: 'OPTION_PRICE_BIZ_THEME_EFFECT', title: '스페셜 테마 이펙트 요금', desc: '배너 테두리에 화려한 네온, 골드 효과 등을 적용하는 요금입니다.' }}
                    pricingOptions={pricingOptions} 
                    setPricingOptions={setPricingOptions} 
                  />
                </div>
              </TabsContent>

              {/* 서브탭 3: 사이드 배너 */}
              <TabsContent value="side_ad" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {/* 최대 구좌수 설정 */}
                  <SingleConfigCard
                    configKey="LIMIT_SIDE_SLOTS"
                    title="최대 구좌수 (전체 슬롯 제한)"
                    desc="사이드 배너 영역에 노출될 수 있는 전체 광고 구좌의 수입니다."
                    unit="구좌"
                    pricingOptions={pricingOptions}
                    setPricingOptions={setPricingOptions}
                  />
                  {/* 고정 구좌수 설정 */}
                  <SingleConfigCard
                    configKey="LIMIT_SIDE_FIXED_SLOTS"
                    title="고정 구좌수 (Fix Slot 제한)"
                    desc="사이드 배너 상단에 롤링 없이 고정 노출되는 최대 구좌 수입니다."
                    unit="구좌"
                    pricingOptions={pricingOptions}
                    setPricingOptions={setPricingOptions}
                  />
                  {/* 사이드 기본 요금 */}
                  <OptionCard 
                    baseOpt={{ key: 'TIER_PRICE_SIDE', title: '사이드 배너 기본 요금', desc: '사이드 배너의 기본 노출 포인트 가격입니다.' }}
                    pricingOptions={pricingOptions} 
                    setPricingOptions={setPricingOptions} 
                  />
                  {/* 사이드 고정 요금 */}
                  <OptionCard 
                    baseOpt={{ key: 'OPTION_PRICE_SIDE_FIXED', title: '스마트 고정 노출 (Fix Slot) 요금', desc: '상단 4구좌 영역에 롤링 없이 상시 고정하는 옵션의 요금입니다.' }}
                    pricingOptions={pricingOptions} 
                    setPricingOptions={setPricingOptions} 
                  />
                  {/* 스페셜 테마 이펙트 요금 */}
                  <OptionCard 
                    baseOpt={{ key: 'OPTION_PRICE_BIZ_THEME_EFFECT', title: '스페셜 테마 이펙트 요금', desc: '배너 테두리에 화려한 네온, 골드 효과 등을 적용하는 요금입니다.' }}
                    pricingOptions={pricingOptions} 
                    setPricingOptions={setPricingOptions} 
                  />
                </div>
              </TabsContent>

              {/* 서브탭 4: 기타 배너들 */}
              <TabsContent value="other_ads" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 mb-6">
                  {OTHER_TIER_OPTIONS.map(tierOpt => (
                    <OptionCard 
                      key={tierOpt.key} 
                      baseOpt={tierOpt} 
                      pricingOptions={pricingOptions} 
                      setPricingOptions={setPricingOptions} 
                    />
                  ))}
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {/* 더블 슬롯 할인율 설정 */}
                  <SingleConfigCard
                    configKey="DISCOUNT_RATIO_BIZ_DOUBLE_SLOT"
                    title="연속 노출 (더블 슬롯) 할인율"
                    desc="배너 2칸을 나란히 구매하여 연속 노출 시 적용되는 퍼센트(%) 할인 비율입니다."
                    unit="%"
                    pricingOptions={pricingOptions}
                    setPricingOptions={setPricingOptions}
                  />
                </div>
              </TabsContent>
            </Tabs>
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

        {/* 탭 4: 활동/추천 포인트 정책 */}
        <TabsContent value="activity" className="mt-0">
          <section className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Coins className="text-primary h-6 w-6" /> 활동 및 친구 추천 보너스 포인트 정책
                </h2>
                <p className="text-[13px] text-gray-500 font-medium mt-1">
                  유저 가입 추천인 등록, 커뮤니티 글쓰기, 댓글 작성 시 지급되는 보너스 포인트를 실시간으로 제어합니다.
                </p>
              </div>
              <Button onClick={handleSavePricing} disabled={isLoading} className="font-bold gap-2">
                <Save className="w-4 h-4" /> 일괄 저장
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2 gap-6 mt-6">
              <SingleConfigCard
                configKey="ACTIVITY_REFERRAL_SIGNUP"
                title="친구 추천 가입자 보상"
                desc="추천인 코드를 입력하고 가입한 회원(본인)에게 지급되는 보너스 포인트입니다."
                unit="P"
                pricingOptions={pricingOptions}
                setPricingOptions={setPricingOptions}
              />
              <SingleConfigCard
                configKey="ACTIVITY_REFERRAL_BONUS"
                title="친구 추천 추천인 보상"
                desc="본인의 추천인 코드로 타 회원이 가입했을 때 추천인에게 지급되는 보너스 포인트입니다."
                unit="P"
                pricingOptions={pricingOptions}
                setPricingOptions={setPricingOptions}
              />
              <CombinedActivityCard
                title="커뮤니티 글쓰기 적립 정책"
                desc="커뮤니티(게시판) 글 작성을 통해 획득할 수 있는 보너스 포인트 설정 및 일일 최대 횟수를 제한합니다."
                configKeyAmt="ACTIVITY_POST_WRITE"
                titleAmt="작성 보상"
                unitAmt="P"
                configKeyLimit="LIMIT_DAILY_POST_COUNT"
                titleLimit="하루 최대 횟수"
                unitLimit="회"
                pricingOptions={pricingOptions}
                setPricingOptions={setPricingOptions}
              />
              <CombinedActivityCard
                title="커뮤니티 댓글 작성 적립 정책"
                desc="커뮤니티 게시글 댓글 작성을 통해 획득할 수 있는 보너스 포인트 설정 및 일일 최대 횟수를 제한합니다."
                configKeyAmt="ACTIVITY_COMMENT_WRITE"
                titleAmt="작성 보상"
                unitAmt="P"
                configKeyLimit="LIMIT_DAILY_COMMENT_COUNT"
                titleLimit="하루 최대 횟수"
                unitLimit="회"
                pricingOptions={pricingOptions}
                setPricingOptions={setPricingOptions}
              />
              <SingleConfigCard
                configKey="LIMIT_DAILY_MAX_EARN_POINTS"
                title="하루 최대 적립포인트 제한"
                desc="한 회원이 하루 동안 활동 및 보너스로 적립할 수 있는 총 포인트의 최대 한도입니다. (단, 친구 추천 및 게임 보상은 제외)"
                unit="P"
                pricingOptions={pricingOptions}
                setPricingOptions={setPricingOptions}
              />
              <SingleConfigCard
                configKey="ACTIVITY_POST_LIKE_RECEIVED"
                title="게시글 공감 획득 보상"
                desc="작성한 게시글이 다른 회원에게 공감(좋아요)을 받았을 때 글쓴이에게 적립되는 보너스 포인트입니다."
                unit="P"
                pricingOptions={pricingOptions}
                setPricingOptions={setPricingOptions}
              />
            </div>
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
