import React from 'react';
import { QA_GET_SEEKER_AD_BY_ID } from '@/src/atoms/qa/resume/QA_GET_SEEKER_AD_BY_ID';
import { SeekerDetailContent } from '@/components/seekers/seeker-detail-content';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function SeekerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    <div className="min-h-[100dvh] pt-[60px] pb-20">
       <div className="max-w-3xl mx-auto w-full bg-white rounded-none sm:rounded-[32px] overflow-hidden sm:shadow-lg sm:mt-10 border border-gray-100">
         <SeekerDetailContent job={result.data} isModal={false} />
       </div>
    </div>
  );
}
