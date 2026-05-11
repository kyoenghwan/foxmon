import { QA_GET_USER_SEEKER_ADS } from '../../qa/resume/QA_GET_USER_SEEKER_ADS';
import { OA_UPSERT_SEEKER_AD, SeekerAdInput } from '../../oa/resume/OA_UPSERT_SEEKER_AD';
import { OA_DELETE_SEEKER_AD } from '../../oa/resume/OA_DELETE_SEEKER_AD';
import { nvLog } from '../../../../lib/logger';

export async function FA_MANAGE_SEEKER_AD_FLOW(
  actionType: 'GET' | 'SAVE' | 'DELETE',
  userId: string,
  adData?: Partial<SeekerAdInput>
) {
  nvLog('AT', `▶️ FA_MANAGE_SEEKER_AD_FLOW 시작 [${actionType}]`, { userId });

  if (actionType === 'GET') {
    const listResult = await QA_GET_USER_SEEKER_ADS(userId);
    return {
      success: listResult.success,
      data: listResult.data,
      message: listResult.success ? '구직글 목록 조회 완료' : listResult.error || '구직글 목록 조회 실패'
    };
  }

  if (actionType === 'SAVE' && adData) {
    if (!adData.resume_id) {
      return { success: false, message: '이력서를 선택해주세요.' };
    }
    if (!adData.ad_title || adData.ad_title.trim() === '') {
      return { success: false, message: '구직글 제목을 입력해주세요.' };
    }
    
    const saveResult = await OA_UPSERT_SEEKER_AD({
        ...adData as SeekerAdInput,
        user_id: userId
    });

    return {
      success: saveResult.success,
      data: saveResult.success ? [saveResult.data] : [],
      message: saveResult.success ? '구직글이 성공적으로 저장되었습니다.' : saveResult.error || '저장에 실패했습니다.'
    };
  }

  if (actionType === 'DELETE' && adData?.id) {
    const deleteResult = await OA_DELETE_SEEKER_AD({
      adId: adData.id,
      userId,
    });

    return {
      success: deleteResult.success,
      message: deleteResult.success ? '구직글이 삭제되었습니다.' : deleteResult.error || '삭제 실패'
    };
  }

  return { success: false, message: '잘못된 액션 요청입니다.' };
}
