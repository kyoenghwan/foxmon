import { QA_GET_SEEKER_BY_ID } from '@/src/atoms/qa/auth/QA_GET_SEEKER_BY_ID';
import { SeekerModalWrapper } from '@/components/seekers/seeker-modal-wrapper';

export default async function SeekerModalInterceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await QA_GET_SEEKER_BY_ID(id);
  
  if (!result.success || !result.data) {
    return null;
  }

  return <SeekerModalWrapper seeker={result.data} />;
}
