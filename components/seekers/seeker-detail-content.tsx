'use client';
import React from 'react';
import { Button } from "@/components/ui/button";
import { X, User2, MapPin, Briefcase, Clock, Phone, MessageCircle } from "lucide-react";
import Image from "next/image";

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
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 w-full relative pb-20">
      {/* Header Image or Solid Background */}
      <div className="h-32 bg-primary relative shrink-0">
        {isModal && onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full z-10"
          >
            <X className="w-6 h-6" />
          </Button>
        )}
      </div>

      <div className="px-6 sm:px-10 -mt-16 relative z-10 shrink-0">
        <div className="flex items-end gap-6">
          <div className="w-32 h-32 rounded-2xl border-4 border-white overflow-hidden bg-white shadow-lg flex-shrink-0 relative">
            {photo_url ? (
              <Image src={photo_url} alt="Profile" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                <User2 className="w-16 h-16" />
              </div>
            )}
          </div>
          <div className="pb-2">
            <h1 className="text-2xl font-black">{ad_title || title || '구직 중입니다.'}</h1>
            <p className="text-gray-600 font-bold mt-1 text-lg">
              {maskedName} <span className="text-gray-400 font-normal text-base ml-1">({genderKr}{age ? `, ${age}` : ''})</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 sm:px-10 py-8 space-y-8 overflow-y-auto mt-4">
        {/* Keywords */}
        {keywords && keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw: string, i: number) => (
              <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-full text-sm">
                #{kw}
              </span>
            ))}
          </div>
        )}

        {/* Desired Conditions */}
        <section>
          <h3 className="text-lg font-black border-b pb-2 mb-4 flex items-center gap-2">
             <Briefcase className="w-5 h-5 text-primary" /> 희망 근무조건
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 font-medium mb-1">희망 지역</div>
              <div className="font-bold">{desired_location || '무관'}</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 font-medium mb-1">희망 업종</div>
              <div className="font-bold">{desired_industry || '무관'}</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 font-medium mb-1">희망 급여</div>
              <div className="font-bold text-primary">{payText}</div>
            </div>
          </div>
        </section>

        {/* Self Intro */}
        <section>
          <h3 className="text-lg font-black border-b pb-2 mb-4">자기소개</h3>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 whitespace-pre-wrap text-gray-700 leading-relaxed min-h-[150px]">
            {self_introduction || '등록된 자기소개가 없습니다.'}
          </div>
        </section>

        {/* Contact Info */}
        <section>
          <h3 className="text-lg font-black border-b pb-2 mb-4 flex items-center gap-2">
             <Phone className="w-5 h-5 text-primary" /> 연락처 및 SNS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 font-medium mb-1">연락처</div>
              <div className="font-bold">
                {is_contact_public ? (contact_number || '미등록') : '비공개 (업소 연락 시 공개)'}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="text-sm text-gray-500 font-medium mb-1">연락 가능 시간</div>
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400" />
                {is_anytime_contact ? '언제든지 가능' : (contact_time || '무관')}
              </div>
            </div>
            {sns_id && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 sm:col-span-2 flex items-center gap-3">
                <MessageCircle className="w-6 h-6 text-green-500" />
                <div>
                  <div className="text-sm text-gray-500 font-medium mb-0.5">{sns_type || 'SNS'} ID</div>
                  <div className="font-bold">{sns_id}</div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="fixed sm:absolute bottom-0 left-0 right-0 p-4 bg-white border-t sm:rounded-b-[32px] flex gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
         <Button className="flex-1 h-14 rounded-2xl text-lg font-black shadow-lg">
           이력서 열람 제안하기
         </Button>
      </div>
    </div>
  );
}
