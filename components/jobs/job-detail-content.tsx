import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import Link from 'next/link';

export function JobDetailContent({ job, isModal = false, onClose }: { job: any, isModal?: boolean, onClose?: () => void }) {
  // DB에 없는 부가 정보들 하드코딩
  const mockContact = {
    nickname: '■ 20대 노래방알바 ■',
    phone: '010-5444-3600',
    kakao: 'foxmon123',
    manager: '양승진 매니저'
  };

  return (
    <div className="flex flex-col min-h-full bg-white relative">
      
      {/* 상단 닫기/뒤로가기 헤더 */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 px-4 h-14 flex items-center justify-between shrink-0">
         <h1 className="text-[15px] font-black text-gray-900 truncate">업체 정보 안내</h1>
         {isModal ? (
           <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100">
             <X className="w-5 h-5" />
           </Button>
         ) : (
           <Link href="/jobs" className="text-[13px] font-bold text-gray-500 hover:text-gray-900">
             닫기
           </Link>
         )}
      </div>

      <div className="flex-1 overflow-y-auto pb-32 md:pb-12">
        <div className="p-4 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 border-b border-gray-100">
            {/* 1-1. 좌측 로고 및 통계 */}
            <div className="w-full md:w-[280px] shrink-0 flex flex-col items-center">
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border border-gray-200/50 p-6 flex flex-col items-center justify-center mb-5 shadow-sm relative overflow-hidden group">
                    <div className="text-gray-800 text-center font-black leading-tight text-2xl tracking-tighter drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
                        {job.company.split(' ').map((line: string, i: number) => <div key={i}>{line}</div>)}
                    </div>
                    {/* Glassmorphism 빛 반사 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/50 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                </div>
                
                <div className="w-full flex items-center justify-center gap-2 mb-5">
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-100/50 shadow-sm flex items-center gap-1">
                        🥇 프리미엄 3회 90일
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                        조회 {Math.floor(Math.random() * 5000)}
                    </span>
                </div>

                <div className="w-full grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-10 rounded-xl flex items-center justify-center gap-1.5 border-blue-100 text-blue-600 bg-blue-50/50 hover:bg-blue-50 text-[13px] font-bold shadow-sm transition-all active:scale-95">
                        <ThumbsUp className="w-4 h-4" /> <span className="text-blue-800">42</span>
                    </Button>
                    <Button variant="outline" className="h-10 rounded-xl flex items-center justify-center gap-1.5 border-red-100 text-red-600 bg-red-50/50 hover:bg-red-50 text-[13px] font-bold shadow-sm transition-all active:scale-95">
                        <ThumbsDown className="w-4 h-4" /> <span className="text-red-800">1</span>
                    </Button>
                </div>
            </div>

            {/* 1-2. 우측 업체 정보 테이블 */}
            <div className="flex-1 flex flex-col justify-center">
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-y-4 md:gap-y-5 text-[14px]">
                    <div className="text-gray-400 font-medium flex items-center">닉네임</div>
                    <div className="font-bold text-gray-900">{mockContact.nickname}</div>
                    
                    <div className="text-gray-400 font-medium flex items-center">전화번호</div>
                    <div className="font-black text-primary text-[20px] md:text-[24px] tracking-tight">{mockContact.phone}</div>
                    
                    <div className="col-span-2 my-2">
                        <div className="bg-gradient-to-r from-[#6b21a8] via-[#86198f] to-[#be185d] p-[1px] rounded-2xl shadow-md overflow-hidden relative group cursor-pointer">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 md:p-5 text-center flex flex-col gap-1 items-center justify-center relative z-10">
                                <p className="font-extrabold text-[13px] text-pink-100 tracking-wide uppercase">Partnership Alert</p>
                                <p className="font-black text-[15px] md:text-[17px] text-white">'여우몬에서 보고 연락드립니다'<span className="font-medium text-[13px] md:text-[14px] text-pink-50 block mt-1">라고 하시면 정확한 상담을 받으실 수 있습니다.</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="text-gray-400 font-medium flex items-center">카카오톡</div>
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span className="bg-[#fee500] text-[#000000] text-[10px] px-2 py-0.5 rounded shadow-sm font-black tracking-tighter">TALK</span> 
                        {mockContact.kakao}
                    </div>

                    <div className="text-gray-400 font-medium flex items-center">상호명</div>
                    <div className="font-bold text-gray-900">{job.company}</div>

                    <div className="text-gray-400 font-medium flex items-center">담당자</div>
                    <div className="font-bold text-gray-900">{mockContact.manager}</div>

                    <div className="text-gray-400 font-medium flex items-center">근무지역</div>
                    <div className="font-bold text-gray-900">{job.location}</div>
                </div>
            </div>
        </div>

        <div className="p-4 md:p-8 space-y-12">
            {/* 2. 업소 이미지 (Squarcles) */}
            <section>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                   <span className="w-1 h-5 bg-primary rounded-full"></span> 업소 이미지
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1,2,3,4].map(idx => (
                    <div key={idx} className="aspect-[4/3] bg-gray-50/80 border border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center text-gray-300 transition-all hover:bg-gray-100 hover:shadow-sm group">
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                           <span className="text-xs font-black">IMG</span>
                        </div>
                        <span className="text-[11px] font-medium text-gray-400">등록된 이미지가<br/>없습니다</span>
                    </div>
                    ))}
                </div>
            </section>

            {/* 3. 기본 채용정보 (Modern Rows) */}
            <section>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                   <span className="w-1 h-5 bg-primary rounded-full"></span> 채용 정보
                </h3>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden text-[14px]">
                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-0 p-1 md:p-2">
                        
                        <div className="flex items-center p-3 border-b border-gray-50">
                           <div className="w-24 shrink-0 text-gray-400 font-medium text-[13px]">업무내용</div>
                           <div className="flex-1 font-bold text-gray-900">{job.title || '노래주점 - TC'}</div>
                        </div>
                        
                        <div className="flex items-center p-3 border-b border-gray-50">
                           <div className="w-24 shrink-0 text-gray-400 font-medium text-[13px]">고용형태</div>
                           <div className="flex-1 font-bold text-gray-900">단기 / 정규직</div>
                        </div>
                        
                        <div className="flex items-center p-3 border-b border-gray-50">
                           <div className="w-24 shrink-0 text-gray-400 font-medium text-[13px]">급여조건</div>
                           <div className="flex-1 font-black text-pink-600 flex items-center gap-2">
                               {job.pay}
                               <span className="bg-pink-50 text-pink-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-black border border-pink-100">당일 지급</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center p-3 border-b border-gray-50">
                           <div className="w-24 shrink-0 text-gray-400 font-medium text-[13px]">마감일자</div>
                           <div className="flex-1 font-bold text-gray-900 flex items-center gap-2">
                               2026-04-20
                               <span className="text-[11px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-black border border-red-100">D-13</span>
                           </div>
                        </div>
                        
                    </div>
                    
                    {/* 풀 위드스(Full-width) 속성들 */}
                    <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                       <div className="grid grid-cols-[80px_1fr] md:grid-cols-[104px_1fr] gap-3">
                           <div className="text-gray-400 font-medium text-[13px] pt-1">편의사항</div>
                           <div className="flex flex-wrap gap-1.5">
                               {['선불가능', '팁별도', '초이스없음', '모셔다드림', '숙식제공'].map(tag => (
                                 <span key={tag} className="text-[12px] bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full shadow-sm font-medium">{tag}</span>
                               ))}
                           </div>
                           
                           <div className="text-gray-400 font-medium text-[13px] pt-1 border-t border-dashed border-gray-200 mt-2 pt-3">키워드</div>
                           <div className="flex flex-wrap gap-1.5 border-t border-dashed border-gray-200 mt-2 pt-3">
                               {['투잡알바', '당일지급', '주말알바', '초보환영'].map(tag => (
                                 <span key={tag} className="text-[12px] bg-blue-50/80 border border-blue-100 text-blue-600 px-2.5 py-1 rounded-full font-bold">{tag}</span>
                               ))}
                           </div>
                       </div>
                    </div>
                </div>
            </section>

            {/* 4. 상세 채용 정보 및 웅장한 포스터 */}
            <section className="pt-8 border-t border-gray-100 mt-8">
                <div className="flex flex-col items-center">
                    
                    {/* 유려한 섹션 타이틀 */}
                    <div className="inline-block text-center mb-10 relative">
                        <span className="absolute -inset-1 block bg-gradient-to-r from-orange-200 to-primary/40 blur opacity-50 rounded-lg"></span>
                        <h3 className="relative text-xl md:text-2xl font-black text-gray-900">상세 채용 내용</h3>
                        <p className="relative mt-2 text-sm text-gray-400 font-semibold uppercase tracking-wider">{job.company}</p>
                    </div>

                    <div className="w-full text-center text-[15px] sm:text-[16px] leading-[1.8] text-gray-700 font-medium max-w-2xl px-4 mb-12">
                        안녕하세요! <b className="text-primary font-black text-[17px]">{job.company}</b>에서 열정과 꿈을 가진 분들을 모십니다.<br/>
                        동종 업계 최고의 대우를 약속드리며, 가족처럼 편안하고 즐겁게 일할 수 있는 환경을 제공합니다.<br/>
                        망설이지 마시고 언제든 편하게 연락 주세요!
                    </div>
                    
                    {/* 웅장한 전단지 이미지 */}
                    {job.image ? (
                        <div className="w-full flex justify-center mt-4 group">
                            <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-200 group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-shadow duration-500">
                                <img 
                                    src={job.image} 
                                    className="w-full max-w-4xl object-contain bg-white" 
                                    alt="채용 전단지" 
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-2xl"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 bg-gray-50 rounded-3xl w-full text-gray-300 font-bold border-2 border-dashed border-gray-200 max-w-3xl">
                            <span className="text-4xl mb-4 opacity-50">🦊</span>
                            등록된 상세 전단지 이미지가 없습니다.
                        </div>
                    )}
                </div>
            </section>
        </div>
      </div>

      {/* 모바일 하단 지원 바 (모달 안에서도 고정) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-100 p-3 sm:p-4 flex gap-2 z-50 pb-5">
        <Button variant="outline" className="h-[52px] w-[52px] shrink-0 border-gray-200 rounded-2xl shadow-sm text-gray-400 hover:text-red-500 transition-colors">
           <Heart className="w-6 h-6" />
        </Button>
        <Button className="flex-1 h-[52px] bg-gray-900 hover:bg-black text-white font-black text-[16px] shadow-lg flex items-center justify-center gap-2 rounded-2xl transition-transform active:scale-[0.98]">
           <MessageCircle className="w-5 h-5" /> 전화/문자 지원하기
        </Button>
      </div>

    </div>
  );
}
