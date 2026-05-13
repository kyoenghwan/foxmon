import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import Link from 'next/link';

export function JobDetailContent({ job, isModal = false, onClose }: { job: any, isModal?: boolean, onClose?: () => void }) {
  // DB에 없는 부가 정보들 하드코딩 대체 (실제 job 데이터 사용, 없으면 비공개/기본값)
  const contact = {
    nickname: job.nickname || '비공개',
    phone: job.contact_phone || '비공개',
    kakao: job.kakao_id || '비공개',
    manager: job.contact_name || job.company_name || job.company || '담당자'
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

      <div className="flex-1 overflow-y-auto pb-32 md:pb-12 bg-gray-50/50">
        <div className="max-w-[1100px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* ================= 좌측: 메인 콘텐츠 영역 ================= */}
          <div className="flex-1 min-w-0 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 border-b border-gray-100">
            {/* 1-1. 좌측 로고 및 통계 */}
            <div className="w-full md:w-[280px] shrink-0 flex flex-col items-center">
                <div className="w-full aspect-[3/2] bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border border-gray-200/50 flex flex-col items-center justify-center mb-5 shadow-sm relative overflow-hidden group">
                    {(job.logo_url || job.image) ? (
                        <img src={job.logo_url || job.image} alt={job.company_name || job.company} className="w-full h-full object-contain bg-white" />
                    ) : (
                        <div className="text-gray-800 text-center font-black leading-tight text-xl tracking-tighter drop-shadow-sm group-hover:scale-105 transition-transform duration-500 p-6">
                            {(job.company_name || job.company || '').split(' ').map((line: string, i: number) => <div key={i}>{line}</div>)}
                        </div>
                    )}
                    {/* Glassmorphism 빛 반사 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/50 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                </div>
                
                <div className="w-full flex items-center justify-center gap-2 mb-5">
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[11px] font-bold border border-amber-100/50 shadow-sm flex items-center gap-1">
                        👑 프리미엄 광고
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
                    <div className="font-bold text-gray-900">{contact.nickname}</div>
                    
                    <div className="text-gray-400 font-medium flex items-center">전화번호</div>
                    <div className="font-black text-primary text-[20px] md:text-[24px] tracking-tight">{contact.phone}</div>
                    
                    <div className="col-span-2 my-1">
                        <div className="bg-pink-50/80 text-pink-600 border border-pink-100 rounded-lg p-2.5 text-center text-[12px] sm:text-[13px] font-medium shadow-sm">
                            <b className="font-bold">'여우몬에서 보고 연락드립니다'</b> 라고 하시면 정확한 상담을 받으실 수 있습니다.
                        </div>
                    </div>

                    <div className="text-gray-400 font-medium flex items-center">카카오톡</div>
                    <div className="font-bold text-gray-900 flex items-center gap-2">
                        <span className="bg-[#fee500] text-[#000000] text-[10px] px-2 py-0.5 rounded shadow-sm font-black tracking-tighter">TALK</span> 
                        {contact.kakao}
                    </div>

                    <div className="text-gray-400 font-medium flex items-center">상호명</div>
                    <div className="font-bold text-gray-900">{job.company_name || job.company}</div>

                    <div className="text-gray-400 font-medium flex items-center">담당자</div>
                    <div className="font-bold text-gray-900">{contact.manager}</div>

                    <div className="text-gray-400 font-medium flex items-center">근무지역</div>
                    <div className="font-bold text-gray-900">{job.location}</div>
                </div>
            </div>
        </div>

        <div className="p-4 md:p-8 space-y-12">
            {/* 2. 업소 이미지 (Squarcles) - 이미지가 있을 때만 노출 */}
            {Array.isArray(job.gallery_images || job.images) && (job.gallery_images || job.images).length > 0 && (
            <section>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                   <span className="w-1 h-5 bg-primary rounded-full"></span> 업소 이미지
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(job.gallery_images || job.images).map((imgUrl: string, idx: number) => (
                    <div key={idx} className="aspect-[4/3] bg-gray-50/80 border border-gray-100 rounded-2xl flex flex-col items-center justify-center overflow-hidden transition-all hover:shadow-sm group">
                        <img src={imgUrl} alt="업소 이미지" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    ))}
                </div>
            </section>
            )}

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
                               {job.pay || (job.salary_type ? `[${job.salary_type}] ${job.salary_amount}원` : '협의')}
                               <span className="bg-pink-50 text-pink-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-black border border-pink-100">당일 지급</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center p-3 border-b border-gray-50">
                           <div className="w-24 shrink-0 text-gray-400 font-medium text-[13px]">마감일자</div>
                           <div className="flex-1 font-bold text-gray-900 flex items-center gap-2">
                               {job.deadline || '상시 모집'}
                           </div>
                        </div>
                        
                    </div>
                    
                    {/* 풀 위드스(Full-width) 속성들 */}
                    <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                       <div className="grid grid-cols-[80px_1fr] md:grid-cols-[104px_1fr] gap-3">
                           <div className="text-gray-400 font-medium text-[13px] pt-1">편의사항</div>
                           <div className="flex flex-wrap gap-1.5">
                               {Array.isArray(job.amenities) && job.amenities.length > 0 ? job.amenities.map((tag: string) => (
                                 <span key={tag} className="text-[12px] bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full shadow-sm font-medium">{tag}</span>
                               )) : <span className="text-[12px] text-gray-400">등록된 편의사항이 없습니다.</span>}
                           </div>
                           
                           <div className="text-gray-400 font-medium text-[13px] pt-1 border-t border-dashed border-gray-200 mt-2 pt-3">키워드</div>
                           <div className="flex flex-wrap gap-1.5 border-t border-dashed border-gray-200 mt-2 pt-3">
                               {Array.isArray(job.keywords) && job.keywords.length > 0 ? job.keywords.map((tag: string) => (
                                 <span key={tag} className="text-[12px] bg-blue-50/80 border border-blue-100 text-blue-600 px-2.5 py-1 rounded-full font-bold">{tag}</span>
                               )) : <span className="text-[12px] text-gray-400">등록된 키워드가 없습니다.</span>}
                           </div>
                       </div>
                    </div>
                </div>
            </section>

            {/* 4. 상세 채용 정보 및 웅장한 포스터 */}
            <section className="pt-8 border-t border-gray-100 mt-8">
                <div className="flex flex-col items-center">
                    
                    <h3 className="w-full text-left text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                       <span className="w-1 h-5 bg-primary rounded-full"></span> 상세 채용 내용
                    </h3>

                    <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 md:p-10 flex flex-col items-center">
                        {/* 에디터 본문 내용 또는 웅장한 전단지 이미지 */}
                        {job.detail_content ? (
                            <div 
                                className="w-full rounded-xl overflow-hidden shadow-sm border border-gray-200 min-h-[400px] flex justify-center"
                                style={{
                                    backgroundColor: job.detail_bg_color || 'transparent',
                                    backgroundImage: job.detail_bg_image ? `url(${job.detail_bg_image.replace('PATTERN|', '')})` : 'none',
                                    backgroundSize: job.detail_bg_image?.startsWith('PATTERN|') ? 'auto' : 'cover',
                                    backgroundRepeat: job.detail_bg_image?.startsWith('PATTERN|') ? 'repeat' : 'no-repeat',
                                    backgroundPosition: 'top center'
                                }}
                            >
                                <div 
                                    className="w-full max-w-4xl min-h-full"
                                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}
                                    dangerouslySetInnerHTML={{ __html: job.detail_content }} 
                                />
                            </div>
                        ) : (job.logo_url || job.image) ? (
                            <div className="w-full flex justify-center group">
                                <div className="relative rounded-xl overflow-hidden shadow-sm border border-gray-200">
                                    <img 
                                        src={job.logo_url || job.image} 
                                        className="w-full max-w-4xl object-contain bg-white" 
                                        alt="채용 전단지" 
                                    />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-2xl w-full text-gray-300 font-bold border-2 border-dashed border-gray-200 max-w-3xl">
                                <span className="text-4xl mb-4 opacity-50">🦊</span>
                                등록된 상세 내용이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
      </div>

      {/* ================= 우측: 데스크탑 전용 사이드바 (모던 연락처 카드) ================= */}
      <div className="hidden lg:block w-[320px] shrink-0">
        <div className="sticky top-6 space-y-4">
            
            {/* 1. 담당자 프로필 및 다이렉트 지원 카드 */}
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-lg shadow-gray-200/50 p-6 flex flex-col items-center text-center overflow-hidden relative group">
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-gray-50 to-gray-100 -z-10"></div>
                
                <div className="w-20 h-20 bg-white rounded-full p-1 shadow-md mb-3 mt-4 relative">
                    <div className="w-full h-full rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-3xl">
                        🦊
                    </div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                <div className="bg-primary/10 text-primary text-[11px] font-black px-2.5 py-0.5 rounded-full mb-2">담당 매니저</div>
                <h3 className="font-black text-gray-900 text-[18px] mb-1">{contact.manager}</h3>
                <p className="text-[13px] text-gray-500 font-medium mb-6">친절하고 편안하게 상담해 드립니다.</p>
                
                <div className="w-full space-y-2.5">
                    {/* 카카오톡 지원 */}
                    <Button className="w-full h-12 rounded-xl bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] font-black text-[15px] shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95">
                        <span className="text-lg">💬</span> 카카오톡으로 지원하기
                    </Button>
                    
                    {/* 전화번호 복사 */}
                    <Button variant="outline" className="w-full h-12 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-[14px] shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95">
                        <span className="text-gray-400">📞</span> {contact.phone} 복사
                    </Button>
                </div>
            </div>

            {/* 2. FoxTalk 안내 배너 (향후 메신저 도입 대비) */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-[24px] p-5 text-white shadow-xl flex items-center justify-between group cursor-pointer hover:scale-[1.02] transition-transform">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-primary text-[18px]">⚡</span>
                        <span className="font-black text-[15px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">FoxTalk</span>
                    </div>
                    <span className="text-[12px] text-gray-400 font-medium leading-tight">번호 노출 없이 안전하게<br/>1:1 익명 채팅을 시작하세요.</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-primary transition-colors">
                    <MessageCircle className="w-5 h-5" />
                </div>
            </div>

        </div>
      </div>
      
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
