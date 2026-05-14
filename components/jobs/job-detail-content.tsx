'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import Link from 'next/link';
import { OA_INSERT_CHAT_ROOM } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_ROOM';

export function JobDetailContent({ job, isModal = false, onClose }: { job: any, isModal?: boolean, onClose?: () => void }) {
  const getSnsBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'kakao': return <span className="bg-[#fee500] text-[#000000] text-[10px] px-1.5 py-0.5 rounded shadow-sm font-black tracking-tighter">TALK</span>;
      case 'instagram': return <span className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm font-black tracking-tighter">INSTA</span>;
      case 'telegram': return <span className="bg-[#0088cc] text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm font-black tracking-tighter">TELE</span>;
      case 'line': return <span className="bg-[#00B900] text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm font-black tracking-tighter">LINE</span>;
      case 'x': return <span className="bg-black text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm font-black tracking-tighter">𝕏</span>;
      default: return <span className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded shadow-sm font-black tracking-tighter">LINK</span>;
    }
  };

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
           <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 shrink-0">
             <X className="w-5 h-5" />
           </Button>
         ) : (
           <Link href="/jobs" className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 shrink-0">
             <X className="w-5 h-5" />
           </Link>
         )}
      </div>

      <div className="flex-1 overflow-y-auto pb-32 md:pb-12 bg-gray-50/50">
        
        {/* ================= 상단 고정 영역 (레이아웃 개선) ================= */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm shrink-0">
            <div className="max-w-[1000px] mx-auto p-4 md:p-5 flex flex-col md:flex-row gap-5 md:gap-6 items-start">
                
                {/* 왼쪽: 배너(로고) 및 통계 */}
                <div className="w-full md:w-[260px] shrink-0 flex flex-col items-center">
                    <div className="w-full aspect-[3/2] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 flex flex-col items-center justify-center mb-2.5 shadow-sm relative overflow-hidden group">
                        {(job.logo_url || job.image) ? (
                            <img src={job.logo_url || job.image} alt={job.company_name || job.company} className="w-full h-full object-contain bg-white" />
                        ) : (
                            <div className="text-gray-800 text-center font-black leading-tight text-lg tracking-tighter drop-shadow-sm group-hover:scale-105 transition-transform duration-500 p-4">
                                {(job.company_name || job.company || '').split(' ').map((line: string, i: number) => <div key={i}>{line}</div>)}
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/50 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]"></div>
                    </div>
                    
                    <div className="w-full flex justify-between items-center px-1 mb-2">
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100/50 flex items-center gap-1">
                            👑 프리미엄
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">조회 {Math.floor(Math.random() * 5000)}</span>
                    </div>

                    <div className="w-full grid grid-cols-2 gap-1.5">
                        <Button variant="outline" className="h-7 rounded-lg border-blue-100 text-blue-600 bg-blue-50/50 hover:bg-blue-50 text-[11px] font-bold shadow-sm transition-all active:scale-95 px-0">
                            <ThumbsUp className="w-3 h-3 mr-1" /> <span className="text-blue-800">42</span>
                        </Button>
                        <Button variant="outline" className="h-7 rounded-lg border-red-100 text-red-600 bg-red-50/50 hover:bg-red-50 text-[11px] font-bold shadow-sm transition-all active:scale-95 px-0">
                            <ThumbsDown className="w-3 h-3 mr-1" /> <span className="text-red-800">1</span>
                        </Button>
                    </div>
                </div>

                {/* 오른쪽: 상호명, 연락처/SNS, 폭스토크 지원 */}
                <div className="flex-1 w-full flex flex-col gap-3 md:gap-4 md:py-1">
                    
                    {/* 상단: 상호명 및 업체 정보 박스 */}
                    <div className="flex flex-col mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">업체명</span>
                            <h3 className="font-black text-gray-900 text-lg md:text-xl truncate">{job.company_name || job.company || '업체명 미상'}</h3>
                        </div>
                        
                        <h3 className="text-[14px] font-black text-gray-900 mb-2 mt-2 flex items-center gap-1.5">
                           <span className="w-1 h-3.5 bg-primary rounded-full"></span> 업체 정보
                        </h3>
                        <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 shadow-sm relative overflow-hidden mb-3">
                            <div className="grid grid-cols-[70px_1fr] gap-y-3 text-[13px] md:text-[14px]">
                                <div className="text-gray-500 font-bold flex items-center">닉네임</div>
                                <div className="font-bold text-gray-900">{contact.nickname}</div>
                                
                                <div className="text-gray-500 font-bold flex items-center">담당자</div>
                                <div className="font-bold text-gray-900">{contact.manager}</div>

                                <div className="text-gray-500 font-bold flex items-center">업체주소</div>
                                <div className="font-bold text-gray-900 flex items-center gap-1">
                                    <span className="text-[11px] opacity-70">📍</span> {job.address || job.location || '주소 미상'}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-[14px] font-black text-gray-900 mb-2 mt-1 flex items-center gap-1.5">
                           <span className="w-1 h-3.5 bg-primary rounded-full"></span> 연락처
                        </h3>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                            <div className="grid grid-cols-[70px_1fr] gap-y-3 text-[13px] md:text-[14px]">
                                <div className="text-gray-500 font-bold flex items-center">전화번호</div>
                                <div className="font-black text-primary text-[16px] md:text-[18px] tracking-tight flex items-center justify-between group">
                                    <span>{contact.phone}</span>
                                    {contact.phone !== '비공개' && (
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(contact.phone).then(() => alert(`전화번호 '${contact.phone}' 가 복사되었습니다!`))}
                                            className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 rounded text-[11px] font-bold shadow-sm active:scale-95 transition-transform"
                                        >
                                            복사
                                        </button>
                                    )}
                                </div>
                                
                                {/* SNS Links: Map over array */}
                                {Array.isArray(job.sns_links) && job.sns_links.length > 0 ? (
                                    job.sns_links.map((sns: any, idx: number) => (
                                        <React.Fragment key={idx}>
                                            <div className="text-gray-500 font-bold flex items-center capitalize">{sns.type}</div>
                                            <div className="font-bold text-gray-900 flex items-center justify-between group">
                                                <span className="truncate mr-2 flex items-center gap-1.5 text-[13px]">
                                                    {getSnsBadge(sns.type)} {sns.value}
                                                </span>
                                                <button 
                                                    onClick={() => {
                                                        if (sns.value.startsWith('http')) window.open(sns.value, '_blank');
                                                        else navigator.clipboard.writeText(sns.value).then(() => alert(`'${sns.value}' 가 복사되었습니다!`));
                                                    }}
                                                    className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 rounded text-[11px] font-bold shadow-sm active:scale-95 transition-transform shrink-0"
                                                >
                                                    복사
                                                </button>
                                            </div>
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <>
                                        <div className="text-gray-500 font-bold flex items-center">카카오톡</div>
                                        <div className="font-bold text-gray-900 flex items-center justify-between group">
                                            <span className="flex items-center gap-1.5 text-[13px]">
                                                {getSnsBadge('kakao')} {contact.kakao}
                                            </span>
                                            {contact.kakao !== '비공개' && (
                                                <button 
                                                    onClick={() => navigator.clipboard.writeText(contact.kakao).then(() => alert(`카카오톡 아이디 '${contact.kakao}' 가 복사되었습니다!`))}
                                                    className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 rounded text-[11px] font-bold shadow-sm active:scale-95 transition-transform"
                                                >
                                                    복사
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* 하단: FoxTalk 지원 (풀사이즈) */}
                    <div 
                        onClick={async () => {
                            try {
                                const res = await fetch('/api/auth/session');
                                const session = await res.json();
                                if (!session?.user?.id) { alert('로그인이 필요합니다.'); window.location.href = '/login'; return; }
                                if (session.user.role === 'EMPLOYER') { alert('업체회원은 지원자만 대화를 걸 수 있습니다.'); return; }
                                
                                const createRes = await OA_INSERT_CHAT_ROOM({
                                    title: `${job.company_name || job.company || '업소명 미상'} - ${job.title || '구인구직 대화방'}`,
                                    type: '1ON1', max_participants: 2, created_by: session.user.id, job_id: job.id, employer_id: job.user_id, seeker_id: session.user.id
                                });
                                if (createRes.success) window.dispatchEvent(new CustomEvent('open_foxtalk', { detail: { roomId: createRes.data.id } }));
                                else alert('채팅방을 생성하지 못했습니다.');
                            } catch (err) {}
                        }}
                        className="w-full bg-gradient-to-br from-gray-900 to-black rounded-xl p-3.5 text-white shadow-md flex items-center justify-between group cursor-pointer hover:scale-[1.01] transition-transform mt-auto"
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                                <span className="text-primary text-[22px]">⚡</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-[15px] md:text-[16px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">FoxTalk 지원하기</span>
                                <span className="text-[11px] md:text-[12px] text-gray-400 font-medium leading-tight">번호 노출 없이 안전한 1:1 익명 채팅</span>
                            </div>
                        </div>
                        <div className="text-[20px] opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all mr-2">→</div>
                    </div>
                    
                </div>
            </div>
        </div>

        {/* ================= 하단 스크롤 영역 (메인 콘텐츠) ================= */}
        <div className="max-w-[1100px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8 md:gap-10">
            
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col p-4 md:p-8 space-y-12">
                
                {/* 2. 업소 이미지 */}
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

                {/* 3. 기본 채용정보 */}
                <section>
                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                       <span className="w-1 h-5 bg-primary rounded-full"></span> 채용 정보
                    </h3>
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-5 md:p-6">
                        <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-y-4 text-[13px] sm:text-[14px]">
                            <div className="text-gray-400 font-medium flex items-center">업무내용</div>
                            <div className="font-bold text-gray-900">{job.title || '노래주점 - TC'}</div>
                            
                            <div className="text-gray-400 font-medium flex items-center">고용형태</div>
                            <div className="font-bold text-gray-900">단기 / 정규직</div>
                            
                            <div className="text-gray-400 font-medium flex items-center">급여조건</div>
                            <div className="font-black text-pink-600 flex items-center gap-2">
                                {job.pay || (job.salary_type ? `[${job.salary_type}] ${job.salary_amount}원` : '협의')}
                                <span className="bg-pink-50 text-pink-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-black border border-pink-100">당일 지급</span>
                            </div>
                            
                            <div className="text-gray-400 font-medium flex items-center">마감일자</div>
                            <div className="font-bold text-gray-900">{job.deadline || '상시 모집'}</div>
                            
                            <div className="text-gray-400 font-medium flex items-center">근무지역</div>
                            <div className="font-bold text-gray-900 flex items-center gap-1">
                                <span className="text-[11px] opacity-70">📍</span> {job.location || '지역 미상'}
                            </div>
                            
                            <div className="col-span-2 my-2 border-t border-dashed border-gray-100"></div>

                            <div className="text-gray-400 font-medium flex items-center">편의사항</div>
                            <div className="flex flex-wrap gap-1.5">
                                {Array.isArray(job.amenities) && job.amenities.length > 0 ? job.amenities.map((tag: string) => (
                                    <span key={tag} className="text-[12px] bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-medium">{tag}</span>
                                )) : <span className="text-[12px] text-gray-400">등록된 편의사항이 없습니다.</span>}
                            </div>
                            
                            <div className="text-gray-400 font-medium flex items-center">키워드</div>
                            <div className="flex flex-wrap gap-1.5">
                                {Array.isArray(job.keywords) && job.keywords.length > 0 ? job.keywords.map((tag: string) => (
                                    <span key={tag} className="text-[12px] bg-blue-50/80 border border-blue-100 text-blue-600 px-2.5 py-1 rounded-full font-bold">{tag}</span>
                                )) : <span className="text-[12px] text-gray-400">등록된 키워드가 없습니다.</span>}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 지원 팁 */}
                <div className="w-full bg-pink-50/50 border border-pink-100 rounded-2xl p-4 sm:p-5 flex items-center justify-center gap-3 text-center shadow-sm">
                    <span className="text-2xl hidden sm:block">🦊</span>
                    <div className="text-[14px] sm:text-[15px] font-medium text-gray-700">
                        <b className="text-pink-600 font-black">"폭스몬에서 보고 연락드립니다."</b> 라고 하시면 상담이 더욱 편하게 진행됩니다!
                    </div>
                </div>



                {/* 4. 상세 채용 정보 및 포스터 */}
                <section className="pt-8 border-t border-gray-100 mt-8">
                    <div className="flex flex-col items-center">
                        <h3 className="w-full text-left text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                           <span className="w-1 h-5 bg-primary rounded-full"></span> 상세 채용 내용
                        </h3>

                        <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6 md:p-10 flex flex-col items-center">
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
                                        <img src={job.logo_url || job.image} className="w-full max-w-4xl object-contain bg-white" alt="채용 전단지" />
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

                <div className="mt-12 pt-6 border-t border-gray-100 text-center text-[11px] text-gray-400 leading-relaxed font-medium pb-4 px-4">
                    본 정보는 <b className="text-gray-500">{job.company_name || job.company || '해당 업체'}</b>에서 제공한 자료이며, 폭스몬은 기재된 내용에 대한 오류와 사용자가 이를 신뢰하여 취한 조치에 대해 책임을 지지 않습니다.<br className="hidden sm:block"/>
                    또한 누구든 본 정보를 폭스몬의 사전 동의 없이 무단 전재 및 크롤링, 재배포 할 수 없습니다.
                </div>
            </div>
        </div>
      </div>
      
      {/* 모바일 하단 지원 바 (모달 안에서도 고정) - 데스크탑에선 상단이 고정이므로 필요없음 */}
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
