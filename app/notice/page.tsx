import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Megaphone, Calendar, ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';

export default function NoticePage() {
  const notices = [
    { id: 1, title: '[공지] 설 연휴 고객센터 운영 시간 안내', date: '2024-02-14', isNew: true, content: '새해 복 많이 받으세요! 설 연휴 기간 동안 고객센터는 2월 9일부터 12일까지 휴무입니다.' },
    { id: 2, title: '[안내] 여우몬 웹 서비스 디자인 고도화 업데이트', date: '2024-02-13', content: '사용자의 편의를 위해 UI/UX가 대폭 개선되었습니다. 더 빠르고 예뻐진 여우몬을 만나보세요!' },
    { id: 3, title: '[이벤트] 친구 초대하고 포인트 받자! (기간 연장)', date: '2024-02-12', isHot: true, content: '많은 참여에 감사드립니다! 이벤트 기간을 2월 말까지 전격 연장합니다.' },
    { id: 4, title: '[중요] 서비스 이용 약관 개정 안내 (24년 3월 시행)', date: '2024-02-10', content: '개인정보 처리방침 및 이용 약관이 일부 변경될 예정입니다.' },
    { id: 5, title: '[점검] 시스템 정기 점검 안내 (2월 20일)', date: '2024-02-08', content: '안정적인 서비스를 위해 새벽 2시부터 4시까지 시스템 점검이 진행됩니다.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. Header Area */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Link href="/" className="p-2 -ml-2 text-gray-500 hover:text-primary transition-colors">
                 <ChevronLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                 <Megaphone className="w-5 h-5 text-primary" /> 공지사항
              </h1>
           </div>
           <button className="p-2 text-gray-400">
              <Search className="w-6 h-6" />
           </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* Notice List Container */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
             {notices.map((notice, idx) => (
                <Link 
                  key={notice.id} 
                  href="#" 
                  className={`block px-6 py-5 hover:bg-gray-50 transition-colors border-b last:border-none group ${idx === 0 ? 'bg-orange-50/10' : ''}`}
                >
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                         {notice.isNew && <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none shrink-0">NEW</span>}
                         {notice.isHot && <span className="bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded leading-none shrink-0">HOT</span>}
                         <span className="text-[12px] text-gray-400 font-bold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {notice.date}
                         </span>
                      </div>
                      <h3 className="text-[15px] md:text-lg font-black text-gray-800 group-hover:text-primary transition-colors leading-snug">
                         {notice.title}
                      </h3>
                      <p className="text-[14px] text-gray-500 line-clamp-1 font-medium italic">
                         {notice.content}
                      </p>
                   </div>
                </Link>
             ))}
          </div>

          {/* Pagination Placeholder */}
          <div className="flex justify-center pt-10 gap-2">
             <Button variant="outline" className="w-10 h-10 p-0 font-black rounded-lg border-gray-200">1</Button>
             <Button variant="ghost" className="w-10 h-10 p-0 font-bold rounded-lg text-gray-400">2</Button>
             <Button variant="ghost" className="w-10 h-10 p-0 font-bold rounded-lg text-gray-400">3</Button>
          </div>
        </div>
      </div>

      {/* Helpful Info Banner */}
      <div className="container mx-auto px-4 mt-12 mb-8">
         <div className="max-w-3xl mx-auto bg-gradient-to-br from-gray-800 to-black p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
               <h4 className="text-xl font-black mb-2">여우몬 고객센터는 24시간 열려 있습니다.</h4>
               <p className="text-gray-400 text-sm font-bold leading-relaxed max-w-[240px]">
                  이용 중 불편한 점이나 제안하고 싶은 사항이 있다면 언제든지 문의주세요.
               </p>
               <Button className="mt-6 bg-white text-black hover:bg-gray-200 font-black h-12 px-8 rounded-xl shadow-lg">
                  1:1 문의하기
               </Button>
            </div>
            <Megaphone className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 -rotate-12 pointer-events-none" />
         </div>
      </div>
    </div>
  );
}
