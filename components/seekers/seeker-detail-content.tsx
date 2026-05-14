'use client';
import React from 'react';
import { Button } from "@/components/ui/button";
import { X, User2, MapPin, Briefcase, Clock, Phone, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function SeekerDetailContent({ job, isModal = false, onClose }: { job: any, isModal?: boolean, onClose?: () => void }) {
  const { ad_title, resumes, users } = job;
  const { 
    nickname, title, gender, birth_year, photo_url, 
    desired_location, desired_industry, desired_pay_type, desired_pay_amount,
    self_introduction, keywords, contact_number, is_contact_public, sns_type, sns_id,
    contact_time, is_anytime_contact
  } = resumes || {};

  // 이름 마스킹
  const rawName = nickname || users?.name || '익명';
  const maskedName = rawName.charAt(0) + 'OO';

  // 나이 계산
  const genderKr = gender === 'F' ? '여성' : gender === 'M' ? '남성' : '무관';
  let age = '';
  const currentYear = new Date().getFullYear();
  if (birth_year) {
      age = `${currentYear - birth_year + 1}세`;
  } else if (users?.birth_date && users.birth_date.length >= 4) {
      const bYear = parseInt(users.birth_date.substring(0, 4));
      age = `${currentYear - bYear + 1}세`;
  }

  // 급여 포맷팅
  let payText = '면접 후 협의';
  if (desired_pay_amount) {
      const typeStr = desired_pay_type === 'HOURLY' ? '시급' : desired_pay_type === 'DAILY' ? '일급' : '월급';
      payText = `${typeStr} ${desired_pay_amount.toLocaleString()}원`;
  }

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 h-14 shrink-0">
        <h2 className="text-lg font-bold text-gray-800">이력서 상세</h2>
        {isModal ? (
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 shrink-0">
            <X className="w-5 h-5" />
          </Button>
        ) : (
          <Link href="/seekers" className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 shrink-0">
            <X className="w-5 h-5" />
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 scrollbar-hide">
        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 relative">
            {photo_url ? (
              <Image src={photo_url} alt="Profile" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <User2 className="w-12 h-12" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-900 mb-2">{ad_title || title || '구직 중입니다.'}</h1>
            <div className="flex items-center gap-3 text-gray-600">
              <span className="font-bold text-lg text-gray-800">{maskedName}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="font-medium">{genderKr}</span>
              {age && (
                <>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="font-medium">{age}</span>
                </>
              )}
            </div>
            
            {/* Keywords */}
            {keywords && keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {keywords.map((kw: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 font-medium rounded-md text-xs">
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full h-px bg-gray-100" />

        {/* Desired Conditions */}
        <section>
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
             <Briefcase className="w-4 h-4 text-gray-400" /> 희망 근무조건
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 font-medium mb-1">희망 지역</div>
              <div className="font-bold text-gray-900">{desired_location || '무관'}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 font-medium mb-1">희망 업종</div>
              <div className="font-bold text-gray-900">{desired_industry || '무관'}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 font-medium mb-1">희망 급여</div>
              <div className="font-bold text-primary">{payText}</div>
            </div>
          </div>
        </section>

        {/* Self Intro */}
        <section>
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
             <User2 className="w-4 h-4 text-gray-400" /> 자기소개
          </h3>
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 whitespace-pre-wrap text-gray-700 text-sm leading-relaxed min-h-[120px]">
            {self_introduction || '등록된 자기소개가 없습니다.'}
          </div>
        </section>

        {/* Contact Info */}
        <section>
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
             <Phone className="w-4 h-4 text-gray-400" /> 연락처 및 SNS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 font-medium mb-1">연락처</div>
              <div className="font-bold text-gray-900">
                {is_contact_public ? (contact_number || '미등록') : '비공개 (업소 연락 시 공개)'}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="text-xs text-gray-500 font-medium mb-1">연락 가능 시간</div>
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {is_anytime_contact ? '언제든지 가능' : (contact_time || '무관')}
              </div>
            </div>
            {sns_id && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 sm:col-span-2 flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-0.5">{sns_type || 'SNS'} ID</div>
                  <div className="font-bold text-gray-900">{sns_id}</div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
