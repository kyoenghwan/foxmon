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
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-bold text-gray-800 truncate mr-2" title={ad_title || title || '구직 중입니다.'}>
          {ad_title || title || '구직 중입니다.'}
        </h2>
        {isModal ? (
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 hover:text-gray-900 rounded-full text-[12px] font-black transition-all focus:outline-none focus-visible:outline-none focus:ring-0 shrink-0"
          >
            닫기
          </button>
        ) : (
          <Link
            href="/seekers"
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-600 hover:text-gray-900 rounded-full text-[12px] font-black transition-all focus:outline-none focus-visible:outline-none focus:ring-0 shrink-0 flex items-center justify-center"
          >
            닫기
          </Link>
        )}
      </div>

      <div className="scrollbar-hide flex-1 space-y-2.5 overflow-y-auto p-4 sm:p-5 pb-20">
        {/* 프로필 + 제목·메타·키워드 (한 행: 사진 좌, 텍스트 우) */}
        <div className="flex flex-row items-start gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 sm:h-28 sm:w-28">
            {photo_url ? (
              <Image src={photo_url} alt="프로필" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                <User2 className="h-12 w-12" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mb-1.5 text-xl font-black leading-snug text-gray-900 sm:text-2xl">
              {maskedName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 sm:text-base">
              <span className="font-medium text-gray-700">{genderKr}</span>
              {age ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-gray-300" />
                  <span className="font-medium text-gray-700">{age}</span>
                </>
              ) : null}
            </div>
            {keywords && keywords.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {keywords.map((kw: string, i: number) => (
                  <span
                    key={i}
                    className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* 희망 근무조건 */}
        <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-3.5">
          <h2 className="mb-3 text-[15px] font-black text-gray-900 sm:text-base">희망 근무조건</h2>
          <div className="space-y-2.5 text-sm leading-relaxed text-gray-800 sm:text-[15px]">
            <div className="flex items-start">
              <span className="font-bold text-gray-500 shrink-0">{formatLabel('지역')}</span>
              <span className="text-gray-400 shrink-0 mx-1.5">:</span>
              <span className="font-bold text-gray-900 flex-1">{desired_location?.trim() || '무관'}</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-gray-500 shrink-0">{formatLabel('업종')}</span>
              <span className="text-gray-400 shrink-0 mx-1.5">:</span>
              <span className="font-bold text-gray-900 flex-1">{industryLine}</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold text-gray-500 shrink-0">{formatLabel('급여')}</span>
              <span className="text-gray-400 shrink-0 mx-1.5">:</span>
              <span className="font-bold text-primary flex-1">{payText}</span>
            </div>
          </div>
        </section>

        {/* 자기소개 */}
        <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-3.5">
          <h2 className="mb-3 text-[15px] font-black text-gray-900 sm:text-base">자기소개</h2>
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-gray-800 sm:text-[15px]">
            {self_introduction?.trim() || '등록된 자기소개가 없습니다.'}
          </p>
        </section>

        {/* 연락처 및 SNS */}
        <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-3.5">
          <div className="mb-3 flex flex-wrap items-baseline gap-2">
            <h2 className="text-[15px] font-black text-gray-900 sm:text-base">연락처 및 SNS</h2>
            <span className="text-[11px] font-medium text-gray-400">
              (연락처를 누르면 복사가 됩니다.)
            </span>
          </div>
          <div className="space-y-2.5 text-sm leading-relaxed text-gray-800 sm:text-[15px]">
            {/* 연락처 */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-start min-w-0 flex-1">
                <span className="font-bold text-gray-500 shrink-0">{formatLabel('연락처')}</span>
                <span className="text-gray-400 shrink-0 mx-1.5">:</span>
                <span
                  onClick={() => is_contact_public && contact_number && handleCopy(contactLine, '연락처')}
                  className={`min-w-0 break-words text-gray-900 font-bold flex-1 ${
                    is_contact_public && contact_number
                      ? 'cursor-pointer hover:underline hover:text-primary transition-all'
                      : ''
                  }`}
                  title={is_contact_public && contact_number ? '클릭 시 복사' : undefined}
                >
                  {contactLine}
                </span>
              </div>
              {is_contact_public && contact_number && (
                <div className="flex items-center gap-3.5 shrink-0 ml-auto mr-1">
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
                    <span className="text-[22px] leading-none">✉️</span>
                  </a>
                </div>
              )}
            </div>

            {/* SNS */}
            {snsDisplayList.length > 0 ? (
              snsDisplayList.map((sns, idx) => (
                <div key={idx} className="flex items-start min-w-0">
                  <span className="font-bold text-gray-500 shrink-0">{formatLabel(sns.label)}</span>
                  <span className="text-gray-400 shrink-0 mx-1.5">:</span>
                  <span
                    onClick={() => handleCopy(sns.id, sns.label)}
                    className="min-w-0 break-words text-gray-900 font-bold flex-1 cursor-pointer hover:underline hover:text-primary transition-all"
                    title="클릭 시 복사"
                  >
                    {sns.id}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-start min-w-0">
                <span className="font-bold text-gray-500 shrink-0">{formatLabel('SNS')}</span>
                <span className="text-gray-400 shrink-0 mx-1.5">:</span>
                <span className="text-gray-500 font-bold flex-1">없음</span>
              </div>
            )}

            {/* 연락가능시간 */}
            <div className="flex items-start min-w-0">
              <span className="font-bold text-gray-500 shrink-0">{formatLabel('연락가능시간')}</span>
              <span className="text-gray-400 shrink-0 mx-1.5">:</span>
              <span className="font-bold text-gray-900 flex-1">{timeLine}</span>
            </div>
          </div>
        </section>
      </div>

      {/* 하단 고정 연락/대화 바 */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 p-3 sm:p-4 flex z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] rounded-b-[24px]">
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
              if (session.user.role === 'SEEKER') {
                alert('구인회원(업소)만 대화를 신청할 수 있습니다.');
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
                window.dispatchEvent(new CustomEvent('open_foxtalk', { detail: { roomId: createRes.data.id } }));
              } else {
                alert(createRes.error || '채팅방을 생성하지 못했습니다.');
              }
            } catch (err) {
              console.error(err);
              alert('대화방 생성 도중 오류가 발생했습니다.');
            }
          }}
          className="w-full h-[52px] bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-black text-[15px] sm:text-[16px] shadow-lg flex items-center justify-center gap-2 rounded-2xl transition-all active:scale-[0.98] group"
        >
          <span className="text-primary text-[20px] mb-0.5">⚡</span>
          FoxTalk 대화하기
        </button>
      </div>
    </div>
  );
}
