import { QA_GET_SEEKER_AD_BY_ID } from '@/src/atoms/qa/resume/QA_GET_SEEKER_AD_BY_ID';
import { QA_CHECK_RESUME_VIEW_PERMISSION } from '@/src/atoms/qa/resume/QA_CHECK_RESUME_VIEW_PERMISSION';
import { SeekerModalWrapper } from '@/components/seekers/seeker-modal-wrapper';
import { SeekerPermissionDeniedModal } from '@/components/seekers/seeker-permission-denied-modal';

export default async function SeekerModalInterceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. 인재 정보 열람 권한 체크
  const permission = await QA_CHECK_RESUME_VIEW_PERMISSION();
  if (!permission.hasPermission) {
    return <SeekerPermissionDeniedModal />;
  }

  const result = await QA_GET_SEEKER_AD_BY_ID(id);
  
  if (!result.success || !result.data) {
    return null;
  }

  return <SeekerModalWrapper seeker={result.data} />;
}
