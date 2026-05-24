'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, User2, Phone, Clock, Copy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { OA_INSERT_CHAT_ROOM } from '@/src/atoms/oa/foxtalk/OA_INSERT_CHAT_ROOM';

function formatIndustry(v: unknown): string {
  if (v == null || v === '') return '무관';
  if (Array.isArray(v)) return v.filter(Boolean).join(', ');
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p.filter(Boolean).join(', ');
    } catch {
      /* plain string */
    }
    return v;
  }
  return String(v);
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  if (cleaned.length === 10) {
    if (cleaned.startsWith('02')) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  if (cleaned.length === 9) {
    if (cleaned.startsWith('02')) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3');
    }
  }
  return phone;
}

function formatLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length === 2) {
    return `${trimmed.charAt(0)} ${trimmed.charAt(1)}`;
  }
  return trimmed;
}

export function SeekerDetailContent({
  job,
  isModal = false,
  onClose,
}: {
  job: any;
  isModal?: boolean;
  onClose?: () => void;
}) {
  const [isMobileDevice, setIsMobileDevice] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobileDevice(isMobile);
    }
  }, []);

  const { ad_title, resumes, users } = job;
  const {
    nickname,
    title,
    gender,
    birth_year,
    photo_url,
    desired_location,
    desired_industry,
    desired_pay_type,
    desired_pay_amount,
    self_introduction,
    keywords,
    contact_number,
    is_contact_public,
    sns_type,
    sns_id,
    sns_links,
    contact_time,
    is_anytime_contact,
  } = resumes || {};

  const snsDisplayList: { label: string; id: string }[] = (() => {
    const raw = sns_links;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw
        .map((x: Record<string, unknown>) => ({
          label: String(x?.type ?? x?.channel ?? 'SNS'),
          id: String(x?.value ?? x?.account ?? '').trim(),
        }))
        .filter((x) => x.id);
    }
    if (sns_id) {
      return [{ label: sns_type || 'SNS', id: sns_id }];
    }
    return [];
  })();

  const rawName = nickname || users?.name || '익명';
  const maskedName = rawName.charAt(0) + 'OO';

  const genderKr = gender === 'F' ? '여성' : gender === 'M' ? '남성' : '무관';
  let age = '';
  const currentYear = new Date().getFullYear();
  if (birth_year) {
    age = `${currentYear - birth_year + 1}세`;
  } else if (users?.birth_date && users.birth_date.length >= 4) {
    const bYear = parseInt(users.birth_date.substring(0, 4), 10);
    age = `${currentYear - bYear + 1}세`;
  }

  let payText = '면접 후 협의';
  if (desired_pay_amount != null && desired_pay_amount !== '') {
    const typeStr =
      desired_pay_type === 'HOURLY' ? '시급' : desired_pay_type === 'DAILY' ? '일급' : '월급';
    const num = typeof desired_pay_amount === 'number' ? desired_pay_amount : Number(desired_pay_amount);
    payText = `${typeStr} ${Number.isFinite(num) ? num.toLocaleString() : String(desired_pay_amount)}원`;
  }

  const industryLine = formatIndustry(desired_industry);
  const formattedContact = is_contact_public && contact_number
    ? formatPhoneNumber(contact_number)
    : '미등록';
  const contactLine = is_contact_public
    ? formattedContact
    : '비공개 (업소 연락 시 공개)';
  const timeLine = is_anytime_contact ? '언제든지 가능' : contact_time || '무관';

  const snsInline =
    snsDisplayList.length > 0
      ? snsDisplayList.map((s) => `${s.label} ${s.id}`).join(' · ')
      : null;

  const handleCopy = (text: string, label: string) => {
    if (!text || text === '미등록' || text.includes('비공개')) return;
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} '${text}'이(가) 복사되었습니다!`);
    }).catch(err => {
      console.error('복사 실패:', err);
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-white text-gray-900 relative rounded-[24px] overflow-hidden">
      {/* 프리미엄 그라데이션 헤더 */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-orange-100/50 bg-gradient-to-r from-orange-50/30 via-white to-white px-4 py-4 sm:px-6">
        <h2 className="text-base sm:text-lg font-extrabold text-gray-800 truncate mr-2" title={ad_title || title || '구직 중입니다.'}>
          {ad_title || title || '구직 중입니다.'}
        </h2>
        {isModal ? (
          <button
            onClick={onClose}
            className="focus:outline-none focus-visible:outline-none focus:ring-0 shrink-0 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 hover:text-gray-900 rounded-full text-[12px] sm:text-[13px] font-black transition-all"
          >
            닫기
          </button>
        ) : (
          <Link
            href="/seekers"
            className="focus:outline-none focus-visible:outline-none focus:ring-0 shrink-0 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 hover:text-gray-900 rounded-full text-[12px] sm:text-[13px] font-black transition-all flex items-center justify-center"
          >
            닫기
          </Link>
        )}
      </div>

      {/* 내부 스크롤 본문 영역 */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6 pb-6 bg-gradient-to-b from-white to-gray-50/30">
        <div className="flex flex-col md:flex-row gap-5 md:items-stretch">
          {/* 좌측 열: 프로필 및 희망 근무조건 */}
          <div className="w-full md:w-1/2 space-y-4">
            {/* 프로필 + 제목·메타·키워드 (한 행: 사진 좌, 텍스트 우) */}
            <div className="flex flex-row items-center gap-4 bg-orange-50/20 border border-orange-100/30 p-4 rounded-[20px]">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[16px] border border-orange-100/50 bg-white sm:h-24 sm:w-24 shadow-[0_4px_12px_rgba(249,115,22,0.06)]">
                {photo_url ? (
                  <Image src={photo_url} alt="프로필" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <User2 className="h-10 w-10 sm:h-12 sm:w-12 text-orange-200" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="mb-1.5 text-lg font-black leading-tight text-gray-900 sm:text-xl flex items-center gap-2">
                  {maskedName}
                </h1>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-orange-50 text-primary border border-orange-100/60 shadow-[0_2px_6px_rgba(249,115,22,0.03)]">
                    {genderKr}
                  </span>
                  {age ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/60 shadow-[0_2px_6px_rgba(79,70,229,0.03)]">
                      {age}
                    </span>
                  ) : null}
                </div>
                {keywords && keywords.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {keywords.map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-md bg-white border border-gray-150 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-gray-500 shadow-sm"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* 희망 근무조건 */}
            <section className="rounded-2xl border border-orange-100 bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.015)] sm:p-5 h-auto md:min-h-[175px] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
              <h2 className="mb-4 text-[14px] sm:text-[15px] font-extrabold text-gray-900 flex items-center">
                <span className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 inline-block mr-2 shadow-sm shadow-orange-500/20" />
                희망 근무조건
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-gray-800 sm:text-[14.5px]">
                <div className="flex items-start">
                  <span className="font-bold text-gray-400 shrink-0 w-12">{formatLabel('지역')}</span>
                  <span className="text-gray-300 shrink-0 mx-1.5">:</span>
                  <span className="font-bold text-gray-900 flex-1">{desired_location?.trim() || '무관'}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-bold text-gray-400 shrink-0 w-12">{formatLabel('업종')}</span>
                  <span className="text-gray-300 shrink-0 mx-1.5">:</span>
                  <span className="font-bold text-gray-900 flex-1">{industryLine}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-bold text-gray-400 shrink-0 w-12">{formatLabel('급여')}</span>
                  <span className="text-gray-300 shrink-0 mx-1.5">:</span>
                  <span className="font-extrabold text-primary flex-1 bg-orange-50/50 px-2 py-0.5 rounded-md w-fit">{payText}</span>
                </div>
              </div>
            </section>
          </div>

          {/* 우측 열: 자기소개 및 연락처/SNS */}
          <div className="w-full md:w-1/2 space-y-4">
            {/* 자기소개 */}
            <section className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.015)] sm:p-5 h-auto md:min-h-[125px] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
              <h2 className="mb-3 text-[14px] sm:text-[15px] font-extrabold text-gray-900 flex items-center">
                <span className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600 inline-block mr-2 shadow-sm shadow-indigo-500/20" />
                자기소개
              </h2>
              <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-gray-700 sm:text-[14.5px]">
                {self_introduction?.trim() || '등록된 자기소개가 없습니다.'}
              </p>
            </section>

            {/* 연락처 및 SNS */}
            <section className="rounded-2xl border border-purple-100 bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.015)] sm:p-5 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.025)]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[14px] sm:text-[15px] font-extrabold text-gray-900 flex items-center">
                  <span className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-purple-400 to-purple-600 inline-block mr-2 shadow-sm shadow-purple-500/20" />
                  연락처 및 SNS
                </h2>
                <span className="text-[10px] font-bold text-purple-500 bg-purple-50 px-2 py-0.5 rounded-md shadow-sm">
                  클릭 시 복사
                </span>
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-gray-800 sm:text-[14.5px]">
                {/* 연락처 */}
                <div className="flex items-center justify-between gap-2 border-b border-gray-50 pb-2">
                  <div className="flex items-start min-w-0 flex-1">
                    <span className="font-bold text-gray-400 shrink-0 w-16">{formatLabel('연락처')}</span>
                    <span className="text-gray-300 shrink-0 mx-1.5">:</span>
                    <span
                      onClick={() => is_contact_public && contact_number && handleCopy(contactLine, '연락처')}
                      className={`min-w-0 break-words font-bold flex-1 transition-all ${
                        is_contact_public && contact_number
                          ? 'text-primary cursor-pointer hover:underline'
                          : 'text-gray-500'
                      }`}
                      title={is_contact_public && contact_number ? '클릭 시 복사' : undefined}
                    >
                      {contactLine}
                    </span>
                  </div>
                  {isMobileDevice && is_contact_public && contact_number && (
                    <div className="flex items-center gap-3 shrink-0 ml-auto mr-1 md:hidden">
                      <a
                        href={`tel:${contact_number}`}
                        className="text-green-500 hover:text-green-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                        title="전화걸기"
                      >
                        <svg className="h-[22px] w-[22px] fill-current" viewBox="0 0 24 24">
                          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.57a1.003 1.003 0 00-1.01.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21a.994.994 0 00.24-1c-.37-1.11-.57-2.3-.57-3.53C6.35 3.35 5.65 2.65 4.93 2.65H1.67C.95 2.65.25 3.35.25 4.07.25 15.07 9.18 24 20.18 24c.72 0 1.42-.7 1.42-1.42v-3.28c0-.72-.7-1.42-1.42-1.42z" />
                        </svg>
                      </a>
                      <a
                        href={`sms:${contact_number}`}
                        className="text-gray-500 hover:text-gray-800 hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
                        title="문자보내기"
                      >
                        <span className="text-[20px] leading-none">✉️</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* SNS */}
                {snsDisplayList.length > 0 ? (
                  snsDisplayList.map((sns, idx) => (
                    <div key={idx} className="flex items-start min-w-0 border-b border-gray-50 pb-2">
                      <span className="font-bold text-gray-400 shrink-0 w-16">{formatLabel(sns.label)}</span>
                      <span className="text-gray-300 shrink-0 mx-1.5">:</span>
                      <span
                        onClick={() => handleCopy(sns.id, sns.label)}
                        className="min-w-0 break-words text-indigo-600 font-bold flex-1 cursor-pointer hover:underline transition-all"
                        title="클릭 시 복사"
                      >
                        {sns.id}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start min-w-0 border-b border-gray-50 pb-2">
                    <span className="font-bold text-gray-400 shrink-0 w-16">{formatLabel('SNS')}</span>
                    <span className="text-gray-300 shrink-0 mx-1.5">:</span>
                    <span className="text-gray-400 font-semibold flex-1">없음</span>
                  </div>
                )}

                {/* 연락가능시간 */}
                <div className="flex items-start min-w-0">
                  <span className="font-bold text-gray-400 shrink-0 w-16">{formatLabel('연락가능시간')}</span>
                  <span className="text-gray-300 shrink-0 mx-1.5">:</span>
                  <span className="font-semibold text-gray-800 flex-1">{timeLine}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* 하단 고정 연락/대화 바 - shrink-0 병렬 배치로 글자 잘림 원천 방어 */}
      <div className="shrink-0 bg-white border-t border-orange-100/50 p-4 flex z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] rounded-b-[24px]">
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/auth/session');
              const session = await res.json();
              if (!session?.user?.id) {
                alert('로그인이 필요합니다.');
                window.location.href = '/login';
                return;
              }
               if (session.user.role !== 'EMPLOYER') {
                alert('구인회원(업소)만 대화를 신청할 수 있습니다.');
                return;
              }
              if (session.user.id === job.user_id) {
                alert('본인이 작성한 이력서에는 대화를 신청할 수 없습니다.');
                return;
              }
              
              // 1:1 채팅방 생성
              const createRes = await OA_INSERT_CHAT_ROOM({
                title: `${maskedName} 님과의 대화방`,
                type: '1ON1',
                max_participants: 2,
                created_by: session.user.id,
                employer_id: session.user.id,
                seeker_id: job.user_id
              });
              
              if (createRes.success) {
                alert('FoxTalk 대화방이 생성되었습니다.');
                if (onClose) {
                  onClose();
                }
                window.dispatchEvent(new CustomEvent('open_foxtalk', { detail: { roomId: createRes.data.id } }));
              } else {
                alert(createRes.error || '채팅방을 생성하지 못했습니다.');
              }
            } catch (err) {
              console.error(err);
              alert('대화방 생성 도중 오류가 발생했습니다.');
            }
          }}
          className="w-full h-[52px] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-extrabold text-[15px] sm:text-[16px] shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 rounded-2xl transition-all active:scale-[0.98] group cursor-pointer"
        >
          <span className="text-white text-[18px] mb-0.5 group-hover:scale-125 transition-transform duration-300">⚡</span>
          FoxTalk 대화하기
        </button>
      </div>
    </div>
  );
}
