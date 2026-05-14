import React from 'react';
import { QA_GET_JOB_BY_ID } from '@/src/atoms/qa/auth/QA_GET_JOB_BY_ID';
import { JobDetailContent } from '@/components/jobs/job-detail-content';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await QA_GET_JOB_BY_ID(id);
  
  if (!result.success || !result.data) {
    return {
      title: '공고를 찾을 수 없습니다 | 폭스몬',
      description: '해당 채용공고는 삭제되었거나 찾을 수 없습니다.',
    };
  }

  const job = result.data;
  // HTML 태그 제거 및 텍스트만 추출하여 description으로 사용 (최대 160자)
  const plainTextDescription = job.content?.replace(/<[^>]*>?/gm, '').substring(0, 160) || '폭스몬 채용공고입니다.';

  return {
    title: `${job.title} | ${job.employer_name || '폭스몬'}`,
    description: plainTextDescription,
    openGraph: {
      title: `${job.title}`,
      description: plainTextDescription,
      images: job.image_url ? [job.image_url] : undefined,
    }
  };
}

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4 md:p-6">
       <div className="relative w-full max-w-[1000px] w-[95vw] sm:w-[90vw] max-h-[90vh] overflow-hidden bg-white sm:rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.2)] flex flex-col rounded-2xl">
          <JobDetailContent job={result.data} isModal={false} />
       </div>
    </div>
  );
}
