import React from 'react';
import { QA_GET_JOB_BY_ID } from '@/src/atoms/qa/auth/QA_GET_JOB_BY_ID';
import { JobDetailContent } from '@/components/jobs/job-detail-content';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
    <div className="min-h-[100dvh]">
       <JobDetailContent job={result.data} isModal={false} />
    </div>
  );
}
