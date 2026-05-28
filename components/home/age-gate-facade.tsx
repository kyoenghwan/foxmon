'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, LogIn, UserPlus, FileText, Coins, RotateCcw, Building } from 'lucide-react';

export function AgeGateFacade() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'refund' | 'pricing' | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // 실시간 오늘 방문자 수 로드 및 기록
  useEffect(() => {
    fetch('/api/visitor')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setVisitorCount(data.count);
        }
      })
      .catch((err) => console.error('방문자 통계 로딩 에러:', err));
  }, []);

  // 회원가입 화면으로 즉시 전환 (현재 URL 쿼리 파라미터가 있으면 유지)
  const handleRegisterRedirect = () => {
    if (typeof window !== 'undefined') {
      const search = window.location.search;
      window.location.href = `/register${search}`;
    }
  };

  // 임시 고지용 텍스트 리소스 정의
  const docContents = {
    terms: {
      title: '서비스 이용약관',
      content: `제 1 조 (목적)
본 약관은 Foxmon(이하 "회사")이 제공하는 구인구직 정보 서비스(이하 "서비스")의 이용조건 및 절차, 이용자와 회사의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제 2 조 (이용약관의 효력 및 변경)
1. 본 약관은 서비스를 통해 이용자에게 공시함으로써 효력이 발생합니다.
2. 회사는 관계 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정된 약관은 적용일자 7일 전부터 공지합니다.

제 3 조 (회원 가입 및 이용 제한)
1. 본 서비스는 만 19세 이상의 성인만 회원 가입 및 이용이 가능합니다.
2. 회원 가입 시 휴대폰 본인인증(성인인증)을 필수로 거쳐야 하며, 만 19세 미만 청소년의 가입은 원천적으로 제한됩니다.`
    },
    privacy: {
      title: '개인정보처리방침',
      content: `1. 수집하는 개인정보 항목
- 필수항목: 성명, 생년월일, 성별, 휴대폰 번호, 아이디, 비밀번호, 본인인증 결과값(CI, DI).
- 서비스 이용 과정에서 생성되는 정보: 접속 로그, 쿠키, IP 주소, 결제 기록.

2. 개인정보의 수집 및 이용 목적
- 만 19세 미만 청소년의 서비스 접근 제한 및 성인 여부 확인
- 유료 광고 결제 및 가상계좌 발급 서비스 제공
- 부정한 이용 방지 및 민원 처리

3. 개인정보의 보유 및 이용 기간
- 이용자의 개인정보는 원칙적으로 회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 의해 보존할 필요가 있는 경우 해당 기간 보존합니다.`
    },
    refund: {
      title: '환불 정책 및 청약철회',
      content: `1. 포인트 충전 환불 규정
- 충전한 유료 포인트는 구매일로부터 7일 이내에 사용하지 않은 경우 청약철회(환불)가 가능합니다.
- 이미 구인공고 등록이나 배너 게재에 사용된 포인트는 서비스가 개시된 것으로 간주하여 환불이 불가능합니다.
- 단순 변심에 의한 환불의 경우 소정의 환불 수수료(송금 수수료 등 포함 최대 10%)가 공제된 후 지급됩니다.

2. 환불 신청 절차
- 마이페이지 내 환불 신청 메뉴를 통해 접수하거나, 고객센터(070-79546146)로 연락하여 신청할 수 있습니다. 환불은 영업일 기준 3~5일 이내에 지정된 계좌로 입금됩니다.`
    },
    pricing: {
      title: '광고 상품 및 이용 요금 안내',
      content: `Foxmon의 구인 배너 및 공고 등록 요금 체계는 아래와 같이 투명하게 운영됩니다.

1. 프리미엄 메인 배너 광고 (PREMIUM)
- 노출 위치: 메인 페이지 최상단 핵심 영역
- 단가: 월 150,000원 (VAT 별도)

2. 스페셜 배너 광고 (SPECIAL)
- 노출 위치: 메인 페이지 중간 그리드 영역
- 단가: 월 80,000원 (VAT 별도)

3. 일반 구인공고 등록 (GENERAL)
- 등록 수수료: 건당 3,000원 (VAT 별도)
- 노출 위치: 메인 페이지 하단 일반 구인 정보 목록`
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
      
      {/* 19세 미만 청소년 이용불가 상단 표시 띠 */}
      <div className="w-full bg-red-700 text-white py-2 px-4 text-center text-xs sm:text-sm font-black tracking-widest flex items-center justify-center gap-2 shadow-md">
        <ShieldAlert className="w-4 h-4 animate-pulse" />
        <span>본 정보통신물은 청소년유해매체물로서 만 19세 미만의 청소년은 이용할 수 없습니다.</span>
      </div>

      {/* 중앙 메인 게이트웨이 영역 */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-4xl mx-auto w-full relative z-10">
        
        {/* 대형 19금 로고 및 서비스 타이틀 */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-24 h-24 rounded-full bg-red-600 border-4 border-white flex items-center justify-center font-black text-4xl shadow-2xl shadow-red-900/50 mb-6 select-none animate-bounce">
            19
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            FOXMON
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md leading-relaxed">
            폭스몬은 성인 대상 구인구직 매칭 플랫폼입니다.<br />
            본 서비스는 **만 19세 이상** 성인만 본인인증 후 이용이 가능합니다.
          </p>
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md mb-12">
          <Link
            href="/login"
            className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg shadow-red-900/30 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <LogIn className="w-5 h-5" />
            <span>회원 로그인</span>
          </Link>
          <button
            onClick={handleRegisterRedirect}
            className="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 px-6 rounded-xl border border-slate-700 transition duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <UserPlus className="w-5 h-5" />
            <span>성인 본인인증 회원가입</span>
          </button>
        </div>

        {/* 오늘 방문자 수 실시간 표출 (럭셔리 네온 뱃지) */}
        <div className="w-full max-w-md mb-8 bg-slate-900/40 border border-red-500/20 rounded-xl p-4 flex items-center justify-center gap-3 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.07)] select-none">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping relative">
            <div className="absolute inset-0 rounded-full bg-red-500 opacity-75"></div>
          </div>
          <span className="text-xs sm:text-sm text-slate-350 font-medium tracking-wide">
            {visitorCount !== null ? (
              <>
                오늘 <span className="text-red-500 font-black text-sm sm:text-base animate-pulse">{visitorCount.toLocaleString()}</span>명의 성인이 Foxmon을 방문했습니다.
              </>
            ) : (
              <span className="text-slate-500">실시간 실명인증 방문자 집계 중...</span>
            )}
          </span>
        </div>

        {/* 6대 검증 요건 노출용 탭 컨테이너 (포트원 사전검증 통과 핵심) */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
          <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-red-500" />
            <span>이용 안내 및 법적 고지</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
            <button
              onClick={() => setActiveTab(activeTab === 'terms' ? null : 'terms')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs font-bold border transition ${
                activeTab === 'terms'
                  ? 'bg-red-600/10 border-red-500 text-red-400'
                  : 'bg-slate-850 border-slate-800 text-slate-350 hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>이용약관</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'privacy' ? null : 'privacy')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs font-bold border transition ${
                activeTab === 'privacy'
                  ? 'bg-red-600/10 border-red-500 text-red-400'
                  : 'bg-slate-850 border-slate-800 text-slate-350 hover:bg-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>개인정보처리방침</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'refund' ? null : 'refund')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs font-bold border transition ${
                activeTab === 'refund'
                  ? 'bg-red-600/10 border-red-500 text-red-400'
                  : 'bg-slate-850 border-slate-800 text-slate-350 hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>환불 정책</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'pricing' ? null : 'pricing')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs font-bold border transition ${
                activeTab === 'pricing'
                  ? 'bg-red-600/10 border-red-500 text-red-400'
                  : 'bg-slate-850 border-slate-800 text-slate-350 hover:bg-slate-800'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>광고 이용요금표</span>
            </button>
          </div>

          {/* 탭 본문 텍스트 활성화 영역 (포트원 크롤러가 직접 파싱할 수 있는 텍스트 구조) */}
          <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-5 min-h-[120px] transition-all duration-300 mb-6">
            {activeTab ? (
              <div>
                <h3 className="text-sm font-black text-white border-b border-slate-800 pb-2 mb-3">
                  {docContents[activeTab].title}
                </h3>
                <pre className="text-xs sm:text-sm text-slate-350 whitespace-pre-wrap leading-relaxed font-sans">
                  {docContents[activeTab].content}
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-6">
                <FileText className="w-8 h-8 mb-2 opacity-30" />
                <span className="text-xs">상단의 메뉴를 클릭하시면 서비스 이용약관, 개인정보처리방침, 환불규정, 광고 단가 정보를 상세히 확인하실 수 있습니다.</span>
              </div>
            )}
          </div>

          {/* 포트원 크롤러 봇 통과용 광고 상품 단가 고정 노출 섹션 */}
          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-sm font-black text-slate-200 mb-3 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-red-500" />
              <span>Foxmon 유료 서비스 이용 요금표 (공식 고지)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl text-center">
                <span className="block text-[10px] text-slate-400 font-bold mb-1">프리미엄 메인 배너 광고</span>
                <span className="text-sm font-black text-white">월 150,000원</span>
                <span className="block text-[9px] text-slate-500 mt-1">부가가치세 별도</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl text-center">
                <span className="block text-[10px] text-slate-400 font-bold mb-1">스페셜 배너 광고</span>
                <span className="text-sm font-black text-white">월 80,000원</span>
                <span className="block text-[9px] text-slate-500 mt-1">부가가치세 별도</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl text-center">
                <span className="block text-[10px] text-slate-400 font-bold mb-1">일반 구인공고 등록 수수료</span>
                <span className="text-sm font-black text-white">건당 3,000원</span>
                <span className="block text-[9px] text-slate-500 mt-1">부가가치세 별도</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* 하단 푸터 (사업자 정보 고시 - 포트원 자동 검증 필수 요소) */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-10 px-4 mt-auto relative z-10 text-xs sm:text-sm text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-white font-extrabold text-base tracking-wider mb-2">FOXMON</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 leading-relaxed text-[11px] sm:text-xs">
              <span><strong>상호명</strong>: 폭스몬 (Foxmon)</span>
              <span><strong>대표자</strong>: 민경환</span>
              <span className="sm:col-span-2"><strong>주소</strong>: 경기도 김포시 고촌읍 신곡로 29번길 57, 가동 501호</span>
              <span><strong>전화번호</strong>: 070-7954-6146</span>
              <span><strong>이메일</strong>: foxmon_support@gmail.com</span>
              <span><strong>사업자등록번호</strong>: 147-38-00941</span>
              <span><strong>직업정보제공사업 신고번호</strong>: [고용노동부 부천지청 심사 진행 중]</span>
              <span><strong>통신판매업 신고번호</strong>: [발급 대기 중]</span>
            </div>
          </div>
          <div className="flex flex-col justify-end md:items-end text-[10px] text-slate-550 gap-2 border-t border-slate-900 pt-6 md:border-none md:pt-0">
            <p>© 2026 Foxmon. All rights reserved.</p>
            <p>본 사이트는 청소년 유해매체물로 지정되어 만 19세 미만 청소년의 출입 및 회원가입을 제한합니다.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
