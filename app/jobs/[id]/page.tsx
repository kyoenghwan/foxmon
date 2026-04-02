import React from 'react';
import { QA_GET_JOB_BY_ID } from '@/src/atoms/qa/auth/QA_GET_JOB_BY_ID';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, DollarSign, Share2, Heart, ChevronLeft, Calendar, Phone } from 'lucide-react';
import Link from 'next/link';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await QA_GET_JOB_BY_ID(id);
  
  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">공고를 찾을 수 없습니다.</h2>
        <Link href="/jobs">
          <Button variant="outline">목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  const job = result.data;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 1. Mobile-friendly Top Navigation */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/jobs" className="p-2 -ml-2 text-gray-600 hover:text-primary transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-[15px] font-black text-gray-900 truncate max-w-[200px]">{job.company}</h1>
          <div className="flex items-center gap-1">
            <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-primary transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-0 md:px-4 md:pt-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
          
          {/* Main Content Side */}
          <div className="flex-1">
            {/* 2. Image Section */}
            <div className="aspect-[16/9] md:rounded-2xl overflow-hidden bg-gray-100 shadow-sm relative">
              {job.image ? (
                <img 
                  src={job.image} 
                  alt={job.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 font-black text-xl">
                  FOXMON IMAGE
                </div>
              )}
              {job.tier === 'PREMIUM' && (
                <div className="absolute top-4 left-4 bg-primary text-black text-[11px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                   🥈 PREMIUM
                </div>
              )}
            </div>

            {/* 3. Title & Base Info */}
            <div className="bg-white p-5 md:rounded-2xl md:mt-6 shadow-sm border-b md:border">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-primary font-bold text-[13px]">
                   <span className="px-2 py-0.5 bg-orange-50 rounded border border-orange-100">{job.company.split(' ')[1] || '모집중'}</span>
                   <span className="text-gray-400">·</span>
                   <span className="text-gray-500 font-medium">조회수 {Math.floor(Math.random() * 1000)}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                  {job.title}
                </h2>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-bold">급여 정보</p>
                    <p className="text-[15px] font-black text-gray-900">{job.pay}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-bold">근무 지역</p>
                    <p className="text-[15px] font-black text-gray-900">{job.location.split(' ')[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-bold">근무 시간</p>
                    <p className="text-[15px] font-black text-gray-900">{job.time || '주야간 협의'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-bold">모집 마감</p>
                    <p className="text-[15px] font-black text-gray-900">상시채용</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Detailed Description */}
            <div className="bg-white p-5 md:rounded-2xl mt-4 shadow-sm md:border">
              <h4 className="text-lg font-black text-gray-900 mb-6 border-l-4 border-primary pl-3">상세 모집요강</h4>
              <div className="space-y-6 text-[15px] text-gray-700 leading-relaxed font-medium">
                <p>
                  안녕하요. <b>{job.company}</b>에서 열점적인 식구를 찾습니다.<br/>
                  저희는 업계 최고의 대우와 가족 같은 분위기를 자랑하는 곳입니다.
                </p>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <p className="font-bold text-gray-900 flex items-center gap-2">✅ 우대 및 지원 자격</p>
                  <ul className="list-disc list-inside pl-1 space-y-1 text-[14px]">
                    <li>초보자 환영 (친절히 가르쳐 드립니다!)</li>
                    <li>장기 근무 가능자 우대</li>
                    <li>밝고 긍정적인 마인드 소유자</li>
                    <li>경력자 최고 대우 보장</li>
                  </ul>
                </div>
                <p className="pt-2"> 
                  궁금하신 점은 언제든 편하게 아래 버튼을 눌러 문의주세요.<br/>
                  부재 시 문자 남겨주시면 확인 즉시 연락드리겠습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar (Desktop only) */}
          <div className="hidden lg:block w-[320px]">
            <div className="bg-white p-6 rounded-2xl shadow-md border sticky top-24">
              <div className="flex flex-col items-center text-center pb-6 border-b">
                 <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-primary mb-3">
                    <span className="font-black text-2xl tracking-tighter">FOX</span>
                 </div>
                 <h5 className="font-black text-lg text-gray-900">{job.company}</h5>
                 <p className="text-[12px] text-gray-400 font-bold">인증된 우수 공고 업체</p>
              </div>
              <div className="py-6 space-y-4">
                 <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-black font-black text-lg shadow-lg">
                    전화로 문의하기
                 </Button>
                 <Button variant="outline" className="w-full h-14 font-black text-gray-700 border-gray-200">
                    문자 지원하기
                 </Button>
              </div>
              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                개인정보 보호를 위해 지원 시<br/> 안전 번호가 사용될 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Mobile Floating Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <Button variant="outline" className="w-14 h-14 md:h-14 p-0 shrink-0 border-gray-200">
           <Heart className="w-6 h-6 text-gray-400" />
        </Button>
        <Button className="flex-1 h-14 bg-primary hover:bg-primary/90 text-black font-black text-lg shadow-md flex items-center justify-center gap-2">
           <Phone className="w-5 h-5 fill-current" /> 전화지원
        </Button>
      </div>
    </div>
  );
}
