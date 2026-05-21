'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import Link from 'next/link';
import { OA_INSERT_CHAT_ROOM } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_ROOM';

export function JobDetailContent({ job, isModal = false, onClose }: { job: any, isModal?: boolean, onClose?: () => void }) {
  const [isScrapped, setIsScrapped] = React.useState(false);

  // 최근 본 공고 및 스크랩 상태 조회
  React.useEffect(() => {
    if (!job?.id) return;

    // 1. 최근 본 공고 저장
    try {
      const recentStr = localStorage.getItem('foxmon_recent') || '[]';
      let recentArr: string[] = JSON.parse(recentStr);
      // 기존 것 제거하고 제일 앞에 추가 (시간 역순 정렬)
      recentArr = recentArr.filter((id) => id !== job.id);
      recentArr.unshift(job.id);
      // 최대 30개 제한
      if (recentArr.length > 30) recentArr = recentArr.slice(0, 30);
      localStorage.setItem('foxmon_recent', JSON.stringify(recentArr));
    } catch (e) {
      console.error(e);
    }

    // 2. 스크랩 여부 판단
    try {
      const scrapStr = localStorage.getItem('foxmon_scraps') || '[]';
      const scrapArr: string[] = JSON.parse(scrapStr);
      setIsScrapped(scrapArr.includes(job.id));
    } catch (e) {
      console.error(e);
    }
  }, [job?.id]);

  const handleToggleScrap = () => {
    if (!job?.id) return;
    try {
      const scrapStr = localStorage.getItem('foxmon_scraps') || '[]';
      let scrapArr: string[] = JSON.parse(scrapStr);
      if (scrapArr.includes(job.id)) {
        scrapArr = scrapArr.filter((id) => id !== job.id);
        setIsScrapped(false);
      } else {
        scrapArr.push(job.id);
        setIsScrapped(true);
      }
      localStorage.setItem('foxmon_scraps', JSON.stringify(scrapArr));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordApplication = () => {
    if (!job?.id) return;
    try {
      const appStr = localStorage.getItem('foxmon_applications') || '[]';
      let appArr: { jobId: string, appliedAt: string }[] = JSON.parse(appStr);
      // 중복 체크
      if (!appArr.some(item => item.jobId === job.id)) {
        appArr.unshift({
          jobId: job.id,
          appliedAt: new Date().toISOString()
        });
        localStorage.setItem('foxmon_applications', JSON.stringify(appArr));
      }
    } catch (e) {
      console.error(e);
    }
  };

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
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 px-4 h-14 flex items-center justify-end shrink-0">
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

      <div className="flex-1 overflow-y-auto pb-28 bg-gray-50/50">
        
        {/* ================= 메인 콘텐츠 영역 ================= */}
        <div className="max-w-[1100px] mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8 md:gap-10">
            
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col p-4 md:p-8 space-y-12">
                
                {/* 1. 업체 정보 */}
                <section>
                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                       <span className="w-1 h-5 bg-primary rounded-full"></span> 업체 정보
                    </h3>
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-5 md:p-6">
                        
                        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                            
                            {/* 로고 영역 */}
                            <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-3">
                                <div className="w-full aspect-[3/2] bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                                    {(job.logo_url || job.image) ? (
                                        <img src={job.logo_url || job.image} alt="로고" className="w-full h-full object-contain bg-white" />
                                    ) : (
                                        <div className="font-black text-gray-800 text-lg">{(job.company_name || job.company)}</div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between px-1">
                                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-100/50">👑 프리미엄</span>
                                    <span className="text-[11px] text-gray-400 font-medium">조회 {Math.floor(Math.random() * 5000)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" className="h-8 rounded-lg border-blue-100 text-blue-600 bg-blue-50/50 hover:bg-blue-50 text-[12px] font-bold px-0 shadow-sm"><ThumbsUp className="w-3.5 h-3.5 mr-1" /> 42</Button>
                                    <Button variant="outline" className="h-8 rounded-lg border-red-100 text-red-600 bg-red-50/50 hover:bg-red-50 text-[12px] font-bold px-0 shadow-sm"><ThumbsDown className="w-3.5 h-3.5 mr-1" /> 1</Button>
                                </div>
                            </div>

                            {/* 업체 정보 내역 영역 */}
                            <div className="flex-1 w-full">
                                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-y-4 text-[13px] sm:text-[14px]">
                                    
                                    {/* 업체명 (닉네임 위) */}
                                    <div className="text-gray-400 font-medium flex items-center">업체명</div>
                                    <div className="font-black text-gray-900 text-[15px]">{job.company_name || job.company || '업체명 미상'}</div>

                                    {/* 닉네임 */}
                                    <div className="text-gray-400 font-medium flex items-center">닉네임</div>
                                    <div className="font-bold text-gray-900">{contact.nickname}</div>
                                    
                                    {/* 담당자 */}
                                    <div className="text-gray-400 font-medium flex items-center">담당자</div>
                                    <div className="font-bold text-gray-900">{contact.manager}</div>

                                    {/* 업체주소 */}
                                    <div className="text-gray-400 font-medium flex items-center">업체주소</div>
                                    <div className="font-bold text-gray-900 flex items-center gap-1">
                                        <span className="text-[11px] opacity-70">📍</span> {job.address || job.location || '주소 미상'}
                                    </div>
                                    
                                    <div className="col-span-2 my-1 border-t border-dashed border-gray-100"></div>

                                    {/* 전화번호 */}
                                    <div className="text-gray-400 font-medium flex items-center">전화번호</div>
                                    <div className="font-black text-primary text-[16px] tracking-tight flex items-center justify-between group">
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
                                    
                                    {/* SNS Links */}
                                    {Array.isArray(job.sns_links) && job.sns_links.length > 0 ? (
                                        job.sns_links.map((sns: any, idx: number) => (
                                            <React.Fragment key={idx}>
                                                <div className="text-gray-400 font-medium flex items-center capitalize">{sns.type}</div>
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
                                            <div className="text-gray-400 font-medium flex items-center">카카오톡</div>
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

                    </div>
                </section>
                
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

                            <div className="text-gray-400 font-medium flex items-center">키워드·혜택</div>
                            <div className="flex flex-wrap gap-1.5">
                                {(() => {
                                    const tags = [
                                        ...new Set([
                                            ...(Array.isArray(job.keywords) ? job.keywords : []),
                                            ...(Array.isArray(job.amenities) ? job.amenities : []),
                                        ]),
                                    ];
                                    return tags.length > 0 ? (
                                        tags.map((tag: string) => (
                                            <span
                                                key={tag}
                                                className="text-[12px] bg-blue-50/80 border border-blue-100 text-blue-600 px-2.5 py-1 rounded-full font-bold"
                                            >
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[12px] text-gray-400">
                                            등록된 키워드·혜택이 없습니다.
                                        </span>
                                    );
                                })()}
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
      
      {/* 하단 고정 지원 바 (공통) */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-100 p-3 sm:p-4 md:p-5 flex gap-2 sm:gap-3 z-50">
        <Button 
            onClick={handleToggleScrap}
            variant="outline" 
            className={`h-[52px] w-[52px] shrink-0 border-gray-200 rounded-2xl shadow-sm transition-colors ${
                isScrapped ? 'text-red-500 hover:text-red-600 bg-red-50/30' : 'text-gray-400 hover:text-red-500'
            }`}
        >
           <Heart className={`w-6 h-6 ${isScrapped ? 'fill-current' : ''}`} />
        </Button>
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
                    if (createRes.success) {
                        handleRecordApplication();
                        window.dispatchEvent(new CustomEvent('open_foxtalk', { detail: { roomId: createRes.data.id } }));
                    }
                    else alert('채팅방을 생성하지 못했습니다.');
                } catch (err) {}
            }}
            className="flex-1 h-[52px] bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-black text-[15px] sm:text-[16px] shadow-lg flex items-center justify-center gap-2 rounded-2xl cursor-pointer transition-transform active:scale-[0.98] group"
        >
            <span className="text-primary text-[20px] mb-0.5">⚡</span>
            FoxTalk 지원하기
        </div>
      </div>

    </div>
  );
}
