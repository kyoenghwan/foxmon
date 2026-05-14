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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 md:p-6">
       <div className="relative w-full max-w-[1000px] w-[95vw] sm:w-[90vw] max-h-[90vh] overflow-hidden bg-white sm:rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col rounded-2xl">
          <SeekerDetailContent job={result.data} isModal={false} />
       </div>
    </div>
  );
}
