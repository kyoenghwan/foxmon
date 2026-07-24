import React from 'react';
import { QA_GET_SEEKER_AD_BY_ID } from '@/src/atoms/qa/resume/QA_GET_SEEKER_AD_BY_ID';
import { QA_CHECK_RESUME_VIEW_PERMISSION } from '@/src/atoms/qa/resume/QA_CHECK_RESUME_VIEW_PERMISSION';
import { SeekerDetailContent } from '@/components/seekers/seeker-detail-content';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function SeekerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. 인재 정보 열람 권한 체크
  const permission = await QA_CHECK_RESUME_VIEW_PERMISSION();
  if (!permission.hasPermission) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
          <div className="w-16 h-16 bg-orange-50 text-primary rounded-full flex items-center justify-center mx-auto text-2xl">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900">인재 정보 열람 제한</h2>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              인재정보는 구인정보에 최소 1개 이상의 구인 공고를 등록하신 구인 업체 회원만 열람하실 수 있습니다. 구인 공고를 먼저 등록해 주세요.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/biz/ads/new">
              <Button className="w-full font-black bg-primary hover:bg-orange-600">구인 공고 등록하기</Button>
            </Link>
            <Link href="/seekers">
              <Button variant="outline" className="w-full font-bold">인재 목록으로 가기</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const result = await QA_GET_SEEKER_AD_BY_ID(id);
  
  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">이력서를 찾을 수 없습니다.</h2>
        <Link href="/seekers">
          <Button variant="outline">목록으로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 md:p-6">
       <div className="relative w-full max-w-[1000px] w-[95vw] sm:w-[90vw] max-h-[90vh] overflow-hidden bg-white sm:rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col rounded-2xl">
          <SeekerDetailContent job={result.data} isModal={false} />
       </div>
    </div>
  );
}
