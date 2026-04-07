import React from 'react';
import { QA_GET_JOB_BY_ID } from '@/src/atoms/qa/auth/QA_GET_JOB_BY_ID';
import { Button } from '@/components/ui/button';
import { Share2, Heart, MessageCircle, ArrowLeft, ThumbsUp, ThumbsDown } from 'lucide-react';
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

  // DB에 없는 부가 정보들 하드코딩
  const mockContact = {
    nickname: '■ 20대 노래방알바 ■',
    phone: '010-5444-3600',
    kakao: 'foxmon123',
    manager: '양승진 매니저'
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
        
      {/* 홈 헤더 역할 보장 */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between lg:max-w-5xl">
            <Link href="/jobs" className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors text-[13px] font-bold">
                <ArrowLeft className="w-4 h-4" /> 뒤로가기
            </Link>
            <h1 className="text-[14px] font-black text-gray-900 truncate">업체정보안내</h1>
            <div className="text-[11px] text-gray-500">조회 : {Math.floor(Math.random() * 5000)}</div>
        </div>
      </div>

      <main className="container mx-auto px-0 md:px-4 py-4 md:py-8 lg:max-w-5xl pb-32">
        <div className="bg-white md:border md:shadow-sm">
            
            {/* 1단계. 업체정보 / 연락처 영역 */}
            <div className="flex flex-col md:flex-row border-b">
                
                {/* 1-1. 좌측 로고 및 통계 */}
                <div className="w-full md:w-[280px] p-6 border-b md:border-b-0 md:border-r bg-gray-50 flex flex-col items-center">
                    <div className="w-full aspect-[4/3] bg-black rounded border border-gray-200 p-2 flex flex-col items-center justify-center mb-4 overflow-hidden relative shadow-inner">
                        {/* 텍스트 로고 예시. DB 이미지가 사실상 전단지이므로 로고는 기본 텍스트 렌더링으로 사용 */}
                        <div className="text-white text-center font-black leading-tight text-xl tracking-tighter">
                            {job.company.split(' ').map((line, i) => <div key={i}>{line}</div>)}
                        </div>
                    </div>
                    
                    <div className="w-full bg-[#fdfaf5] border border-[#e2d5c3] p-3 rounded text-center mb-4">
                        <div className="text-[11px] text-gray-500 mb-1">광고기간</div>
                        <div className="text-[13px] font-bold text-gray-800 flex items-center justify-center gap-1">
                            🥈 3회 90일
                        </div>
                    </div>

                    <div className="w-full flex gap-2">
                        <Button variant="outline" className="flex-1 h-9 rounded-sm flex items-center gap-1 border-blue-200 text-blue-700 bg-blue-50 text-[12px] font-bold px-0 shadow-sm hover:bg-blue-100">
                            <span className="bg-white px-1.5 py-0.5 rounded border border-blue-100 text-black">0</span>
                            <ThumbsUp className="w-3.5 h-3.5 fill-current" /> 좋아요
                        </Button>
                        <Button variant="outline" className="flex-1 h-9 rounded-sm flex items-center gap-1 border-red-200 text-red-700 bg-red-50 text-[12px] font-bold px-0 shadow-sm hover:bg-red-100">
                            <span className="bg-white px-1.5 py-0.5 rounded border border-red-100 text-black">1</span>
                            <ThumbsDown className="w-3.5 h-3.5 fill-current" /> 싫어요
                        </Button>
                    </div>
                </div>

                {/* 1-2. 우측 업체 정보 테이블 */}
                <div className="flex-1 p-6 md:p-8 flex flex-col">
                    <div className="grid grid-cols-[70px_1fr] sm:grid-cols-[100px_1fr] gap-y-4 md:gap-y-5 text-[13px] md:text-[14px]">
                        
                        <div className="text-gray-500 flex items-center gap-1.5 font-medium"><div className="w-1 h-1 bg-gray-400"></div> 닉네임</div>
                        <div className="font-bold text-gray-900">{mockContact.nickname}</div>
                        
                        <div className="text-gray-500 flex items-center gap-1.5 font-medium"><div className="w-1 h-1 bg-gray-400"></div> 전화번호</div>
                        <div className="font-black text-gray-900 text-[16px] md:text-[18px]">{mockContact.phone}</div>
                        
                        <div className="col-span-2 my-2 sm:my-3">
                            <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white p-3 md:p-4 rounded-xl text-center shadow-md animate-pulse">
                                <p className="font-bold text-[13px] md:text-[14px] text-purple-100 mb-0.5">'여우몬에서 보고 연락드립니다'</p>
                                <p className="font-black text-[15px] md:text-[17px]">라고 하시면 정확한 상담을 받으실 수 있습니다.</p>
                            </div>
                        </div>

                        <div className="text-gray-500 flex items-center gap-1.5 font-medium"><div className="w-1 h-1 bg-gray-400"></div> 카카오톡</div>
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span className="bg-[#fee500] text-[#000000] text-[10px] md:text-[11px] px-1.5 py-0.5 rounded font-black">TALK ID</span> 
                            {mockContact.kakao}
                        </div>

                        <div className="text-gray-500 flex items-center gap-1.5 font-medium"><div className="w-1 h-1 bg-gray-400"></div> 상호</div>
                        <div className="font-bold text-gray-900">{job.company}</div>

                        <div className="text-gray-500 flex items-center gap-1.5 font-medium"><div className="w-1 h-1 bg-gray-400"></div> 담당자</div>
                        <div className="font-bold text-gray-900">{mockContact.manager}</div>

                        <div className="text-gray-500 flex items-center gap-1.5 font-medium"><div className="w-1 h-1 bg-gray-400"></div> 근무지역</div>
                        <div className="font-bold text-gray-900">{job.location}</div>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 lg:p-8">
                {/* 2. 업소 이미지 */}
                <div className="mb-12">
                    <div className="flex justify-start mb-0">
                        <div className="bg-gray-500 text-white px-5 py-1.5 text-[13px] font-bold relative after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-solid after:border-t-gray-500 after:border-t-4 after:border-x-transparent after:border-x-4 after:border-b-0">
                            업소이미지
                        </div>
                    </div>
                    <div className="w-full h-1 bg-gray-200 mb-6"></div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 p-4 border border-gray-100">
                        {[1,2,3,4].map(idx => (
                        <div key={idx} className="aspect-[4/3] bg-white border border-gray-200 flex flex-col items-center justify-center text-center text-gray-300 shadow-sm relative group overflow-hidden">
                            <span className="font-black text-[22px] tracking-tighter mb-1 relative z-10 group-hover:scale-110 transition-transform">NO IMG</span>
                            <span className="text-[10px] sm:text-[11px] font-bold leading-tight relative z-10">첨부 된 이미지가<br/>없습니다.</span>
                            {/* 데코 효과 */}
                            <div className="absolute inset-0 bg-gray-100/50 opacity-0 group-hover:opacity-100 transition-opacity z-0"/>
                        </div>
                        ))}
                    </div>
                </div>

                {/* 3. 기본 채용정보 */}
                <div className="mb-12">
                    <div className="flex justify-start mb-0">
                        <div className="bg-gray-500 text-white px-5 py-1.5 text-[13px] font-bold relative after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-solid after:border-t-gray-500 after:border-t-4 after:border-x-transparent after:border-x-4 after:border-b-0">
                            기본채용정보
                        </div>
                    </div>
                    <div className="w-full h-1 bg-gray-200 mb-6"></div>
                    
                    <div className="border-t-2 border-primary border-b bg-white relative">
                        <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[120px_1fr] text-[13px] sm:text-[14px]">
                            
                            <div className="bg-gray-50 p-3 sm:p-4 border-b flex items-center text-gray-500 font-medium"><span className="text-gray-300 mr-2">›</span> 업무내용</div>
                            <div className="p-3 sm:p-4 border-b font-medium text-gray-900">{job.title || '노래주점 - TC'}</div>
                            
                            <div className="bg-gray-50 p-3 sm:p-4 border-b flex items-center text-gray-500 font-medium"><span className="text-gray-300 mr-2">›</span> 고용형태</div>
                            <div className="p-3 sm:p-4 border-b font-medium text-gray-900">고용</div>
                            
                            <div className="bg-gray-50 p-3 sm:p-4 border-b flex items-center text-gray-500 font-medium"><span className="text-gray-300 mr-2">›</span> 급여</div>
                            <div className="p-3 sm:p-4 border-b font-medium text-gray-900 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="bg-[#5bc0de] text-white text-[10px] font-bold px-1.5 py-[2px] rounded-sm leading-none flex items-center justify-center">당일</span> 
                                <span className="text-[#e03b8b] font-black text-[15px] sm:text-[16px]">{job.pay}</span>
                                <span className="text-gray-400 text-[11px] sm:text-[12px] ml-1">2026년 최저시급 10,320원</span>
                            </div>
                            
                            <div className="bg-gray-50 p-3 sm:p-4 border-b flex items-center text-gray-500 font-medium"><span className="text-gray-300 mr-2">›</span> 마감일자</div>
                            <div className="p-3 sm:p-4 border-b font-medium text-gray-400"><span className="text-gray-900">2026-04-20</span> <span className="font-bold ml-1">D-13</span></div>
                            
                            <div className="bg-gray-50 p-3 sm:p-4 border-b flex items-center text-gray-500 font-medium"><span className="text-gray-300 mr-2">›</span> 편의사항</div>
                            <div className="p-3 sm:p-4 border-b font-medium text-gray-400">선불가능, 팁별도, 갯수보장, 출퇴근지원, 초이스없음</div>
                            
                            <div className="bg-gray-50 p-3 sm:p-4 flex items-center text-gray-500 font-medium"><span className="text-gray-300 mr-2">›</span> 키워드</div>
                            <div className="p-3 sm:p-4 font-bold text-[#428bca]">투잡알바, 당일지급, 초보가능, 주점, 룸싸롱</div>
                        </div>
                    </div>
                </div>

                {/* 4. 상세 채용 정보 (전단지) */}
                <div className="mb-0">
                    <div className="flex justify-start mb-0">
                        <div className="bg-gray-500 text-white px-5 py-1.5 text-[13px] font-bold relative after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-solid after:border-t-gray-500 after:border-t-4 after:border-x-transparent after:border-x-4 after:border-b-0">
                            SNS공유
                        </div>
                    </div>
                    <div className="w-full h-1 bg-gray-200 mb-6 flex items-center pt-5 pl-2 gap-1.5 border-b pb-3">
                        <Button size="icon" className="w-[30px] h-[30px] bg-[#1da1f2] hover:bg-[#1a91da] text-white rounded-none p-0"><Share2 className="w-4 h-4"/></Button>
                        <Button size="icon" className="w-[30px] h-[30px] bg-[#3b5998] hover:bg-[#324b80] text-white rounded-none p-0"><Heart className="w-4 h-4"/></Button>
                    </div>

                    <div className="font-bold text-[13px] mb-2 border-b border-gray-300 pb-2 text-gray-700">상세 채용정보</div>
                    <div className="border border-gray-200 bg-white flex flex-col items-center">
                        
                        {/* 포스터 헤더 배너 처리 (기존 사이트의 퀸알바 바) */}
                        <div className="w-full py-4 text-center border-b border-dashed border-gray-300 text-primary font-black flex flex-col items-center justify-center bg-[#fffafa]">
                           <span className="text-2xl italic tracking-tighter">FOXMON</span>
                           <span className="text-xs font-bold text-gray-400 uppercase">foxmon.vercel.app</span>
                        </div>

                        {/* 본문 텍스트가 있다면 여기에 */}
                        <div className="w-full p-8 text-center text-[15px] sm:text-[16px] xl:text-[18px] leading-loose text-gray-800 font-bold bg-[#fffafa]">
                            안녕하세요. <b className="text-primary text-xl">[{job.company}]</b>에서 열정을 가진 식구를 찾습니다.<br/>
                            <span className="text-gray-500 text-sm mt-3 inline-block">저희는 업계 최고의 대우와 가족 같은 분위기를 자랑합니다. 최고 페이 보장!</span>
                        </div>
                        
                        {/* 웅장한 전단지 이미지 위치 (기존의 Hero 16:9 였던 녀석) */}
                        {job.image ? (
                            <div className="w-full bg-black/5 flex justify-center py-10 px-4 md:px-10 border-t">
                                <img 
                                    src={job.image} 
                                    className="w-full max-w-4xl object-contain shadow-2xl border bg-white" 
                                    alt="상세 전단지" 
                                    style={{ minHeight: '500px' }}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-40 bg-gray-50 w-full text-gray-300 font-bold border-t">
                                등록 된 상세 전단지 이미지가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </main>

      {/* 모바일 하단 플로팅 지원 바 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-2 z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] pb-5">
        <Button variant="outline" className="h-[48px] px-3 shrink-0 border-gray-200">
           <Heart className="w-5 h-5 text-gray-400" />
        </Button>
        <Button className="flex-1 h-[48px] bg-primary hover:bg-primary/90 text-black font-black text-[15px] shadow-sm flex items-center justify-center gap-1.5 rounded-md">
           <MessageCircle className="w-4 h-4 fill-current" /> 전화 지원하기
        </Button>
      </div>

    </div>
  );
}
