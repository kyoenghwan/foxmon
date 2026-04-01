import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Plus, CheckCircle2, Zap, Crown, Megaphone, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function JobPostPage() {
  const tiers = [
    { 
      name: 'PREMIUM', 
      icon: Crown, 
      color: 'text-primary', 
      bg: 'bg-primary/5', 
      border: 'border-primary',
      benefits: ['메인 화면 최상단 노출', '22종 임팩트 애니메이션 효과', '검색 결과 최상단 수시 노출', '업체 로고 강조 처리'] 
    },
    { 
      name: 'SPECIAL', 
      icon: Zap, 
      color: 'text-yellow-500', 
      bg: 'bg-yellow-50/50', 
      border: 'border-yellow-200',
      benefits: ['메인 중단 스페셜 영역 노출', '글자 굵기 및 색상 강조', '검색 결과 중간 노출', '합리적인 가격']
    },
    { 
      name: 'GENERAL', 
      icon: Megaphone, 
      color: 'text-gray-500', 
      bg: 'bg-gray-50', 
      border: 'border-gray-200',
      benefits: ['일반 공고 목록 노출', '기본 텍스트 공고', '무제한 무료 등록 이벤트 중']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navigation */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Link href="/" className="p-2 -ml-2 text-gray-500 hover:text-primary transition-colors">
                 <ChevronLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">공고 등록 안내</h1>
           </div>
           <Button variant="ghost" className="text-primary font-black">내 공고 관리</Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-16">
           <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 mb-6 py-1">
             여우몬에서 최고의 인재를 만나보세요.
           </h2>
           <p className="text-lg md:text-xl text-gray-500 font-bold max-w-2xl mx-auto leading-relaxed italic">
             프리미엄 광고부터 일반 공고까지,<br/> 업체 상황에 맞는 최적의 채용 솔루션을 제공합니다.
           </p>
        </div>

        {/* Ad Tier Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
           {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <div key={tier.name} className={`bg-white rounded-3xl p-8 border-2 ${tier.border} shadow-lg hover:translate-y-[-8px] transition-transform duration-300 relative overflow-hidden flex flex-col`}>
                   {tier.name === 'PREMIUM' && (
                     <div className="absolute top-4 right-4 bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-full">BEST</div>
                   )}
                   <div className={`w-14 h-14 ${tier.bg} rounded-2xl flex items-center justify-center mb-6`}>
                      <Icon className={`w-7 h-7 ${tier.color}`} />
                   </div>
                   <h3 className="text-2xl font-black text-gray-900 mb-6 italic tracking-tight">{tier.name}</h3>
                   <ul className="space-y-4 mb-10 flex-1">
                      {tier.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-center gap-2 text-[14px] text-gray-600 font-bold">
                           <CheckCircle2 className={`w-4 h-4 ${tier.color} shrink-0`} />
                           <span>{benefit}</span>
                        </li>
                      ))}
                   </ul>
                   <Button className={`w-full h-14 font-black text-lg rounded-xl shadow-md ${tier.name === 'PREMIUM' ? 'bg-primary hover:bg-primary/90 text-black' : 'bg-gray-900 hover:bg-black text-white'}`}>
                      신청하기
                   </Button>
                </div>
              );
           })}
        </div>

        {/* Bottom Contact Section */}
        <div className="bg-white rounded-3xl p-10 border shadow-sm text-center max-w-3xl mx-auto relative overflow-hidden">
           <div className="relative z-10">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-6">
                 <HelpCircle className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-black text-gray-900 mb-3 tracking-tighter">처음이라 어려우신가요?</h4>
              <p className="text-gray-500 font-bold mb-8 leading-relaxed">
                 전문 매니저가 업체의 업종과 예산에 딱 맞는 광고를 추천해 드립니다.<br/>
                 부담 없이 문의하세요!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <Button variant="outline" className="h-14 px-8 rounded-xl font-black text-lg border-gray-200">카카오톡 문의</Button>
                 <Button className="h-14 px-8 rounded-xl font-black text-lg bg-gray-900 text-white hover:bg-black">실시간 고객센터</Button>
              </div>
           </div>
           <Plus className="absolute -left-10 -bottom-10 w-40 h-40 text-gray-50 rotate-12" />
        </div>
      </div>
    </div>
  );
}
