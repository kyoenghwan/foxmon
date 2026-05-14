import { QA_GET_JOB_BY_ID } from '@/src/atoms/qa/auth/QA_GET_JOB_BY_ID';
import { JobModalWrapper } from '@/components/jobs/job-modal-wrapper';

export default async function JobModalInterceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await QA_GET_JOB_BY_ID(id);
  
  if (!result.success || !result.data) {
    return null;
  }

  return <JobModalWrapper job={result.data} />;
}
