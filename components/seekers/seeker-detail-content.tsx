'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, User2, Phone, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
  const contactLine = is_contact_public
    ? contact_number || '미등록'
    : '비공개 (업소 연락 시 공개)';
  const timeLine = is_anytime_contact ? '언제든지 가능' : contact_time || '무관';

  const snsInline =
    snsDisplayList.length > 0
      ? snsDisplayList.map((s) => `${s.label} ${s.id}`).join(' · ')
      : null;

  return (
    <div className="flex h-full w-full flex-col bg-white text-gray-900 relative">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-bold text-gray-800">이력서 상세</h2>
        {isModal ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <Link
            href="/seekers"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </Link>
        )}
      </div>

      <div className="scrollbar-hide flex-1 space-y-5 overflow-y-auto p-4 sm:p-8">
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
              {ad_title || title || '구직 중입니다.'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 sm:text-base">
              <span className="font-bold text-gray-800">{maskedName}</span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span className="font-medium">{genderKr}</span>
              {age ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-gray-300" />
                  <span className="font-medium">{age}</span>
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

        {/* 근무조건 + 자기소개 + 연락 (한 블록) */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 sm:p-5">
          <div className="space-y-2.5 text-sm leading-relaxed text-gray-800 sm:text-[15px]">
            <p>
              <span className="font-bold text-gray-500">지역</span>
              <span className="text-gray-400"> : </span>
              <span className="font-bold">{desired_location?.trim() || '무관'}</span>
            </p>
            <p>
              <span className="font-bold text-gray-500">업종</span>
              <span className="text-gray-400"> : </span>
              <span className="font-bold">{industryLine}</span>
            </p>
            <p>
              <span className="font-bold text-gray-500">급여</span>
              <span className="text-gray-400"> : </span>
              <span className="font-bold text-primary">{payText}</span>
            </p>
            <div className="border-t border-gray-200/80 pt-3">
              <p className="font-bold text-gray-500">자기소개</p>
              <p className="mt-1 whitespace-pre-wrap text-gray-800">
                {self_introduction?.trim() || '등록된 자기소개가 없습니다.'}
              </p>
            </div>
            <div className="border-t border-gray-200/80 pt-3">
              <p className="mb-2 font-bold text-gray-500">연락처 및 SNS</p>
              <div className="overflow-x-auto pb-0.5 scrollbar-hide">
                <div className="inline-flex min-w-max flex-nowrap items-center gap-x-3 gap-y-0 text-sm font-bold text-gray-900 sm:text-[15px]">
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    연락 : {contactLine}
                  </span>
                  <span className="shrink-0 text-gray-300">|</span>
                  <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    시간 : {timeLine}
                  </span>
                  {snsInline ? (
                    <>
                      <span className="shrink-0 text-gray-300">|</span>
                      <span className="shrink-0 whitespace-nowrap text-[13px] text-gray-800 sm:text-[15px]">
                        SNS : {snsInline}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
