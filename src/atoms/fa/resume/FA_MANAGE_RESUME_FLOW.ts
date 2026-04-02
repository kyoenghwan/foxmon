import { QA_GET_USER_RESUMES } from '../../qa/resume/QA_GET_USER_RESUMES';
import { OA_UPSERT_RESUME, ResumeData } from '../../oa/resume/OA_UPSERT_RESUME';
import { OA_DELETE_RESUME } from '../../oa/resume/OA_DELETE_RESUME';
import { OA_TOGGLE_RESUME_PUBLIC } from '../../oa/resume/OA_TOGGLE_RESUME_PUBLIC';
import { QA_GET_USER_PROFILE } from '../../qa/auth/QA_GET_USER_PROFILE';
import { nvLog } from '../../../../lib/logger';

export async function FA_MANAGE_RESUME_FLOW(
  actionType: 'GET' | 'SAVE' | 'GET_DEFAULTS' | 'DELETE' | 'TOGGLE_PUBLIC',
  userId: string,
  resumeData?: ResumeData
) {
  nvLog('AT', `▶️ FA_MANAGE_RESUME_FLOW 시작 [${actionType}]`, { userId });

  if (actionType === 'GET') {
    // 1. 가져오기
    const listResult = await QA_GET_USER_RESUMES(userId);
    return {
      success: listResult.success,
      data: listResult.data,
      message: listResult.success ? '이력서 목록 조회 완료' : listResult.error || '이력서 목록 조회 실패'
    };
  }

  if (actionType === 'GET_DEFAULTS') {
    // 1-1. 신규 폼 기본값(전화번호 등) 가져오기
    const userResult = await QA_GET_USER_PROFILE(userId);
    return {
      success: userResult.success,
      data: userResult.data, 
      message: userResult.success ? '프로필 조회' : userResult.error || '프로필 조회 실패'
    };
  }

  if (actionType === 'SAVE' && resumeData) {
    // 2. 폼 저장하기
    // 간단한 내부 Validation 로직 (RA 역할 내재화)
    if (!resumeData.title || resumeData.title.trim() === '') {
      return { success: false, message: '이력서 제목을 입력해주세요.' };
    }
    
    const saveResult = await OA_UPSERT_RESUME({
        ...resumeData,
        user_id: userId
    });

    return {
      success: saveResult.success,
      data: saveResult.success ? [saveResult.data] : [],
      message: saveResult.success ? '이력서가 성공적으로 저장되었습니다.' : saveResult.error || '저장에 실패했습니다.'
    };
  }

  if (actionType === 'DELETE' && resumeData?.id) {
    const deleteResult = await OA_DELETE_RESUME({
      resumeId: resumeData.id,
      userId,
    });
    return {
      success: deleteResult.success,
      message: deleteResult.success ? '이력서가 삭제되었습니다.' : deleteResult.error || '삭제에 실패했습니다.',
    };
  }

  if (actionType === 'TOGGLE_PUBLIC' && resumeData?.id) {
    const toggleResult = await OA_TOGGLE_RESUME_PUBLIC({
      resumeId: resumeData.id,
      userId,
      is_public: !!resumeData.is_public,
    });
    return {
      success: toggleResult.success,
      message: toggleResult.success
        ? (resumeData.is_public ? '이력서가 공개되었습니다.' : '이력서가 비공개로 전환되었습니다.')
        : toggleResult.error || '상태 변경에 실패했습니다.',
    };
  }

  return { success: false, message: '잘못된 액션 타입 파라미터입니다.' };
}
