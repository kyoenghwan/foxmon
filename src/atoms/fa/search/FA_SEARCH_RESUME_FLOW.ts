import { QA_SEARCH_RESUMES } from '../../qa/search/QA_SEARCH_RESUMES';
import { nvLog } from '../../../../lib/logger';

export async function FA_SEARCH_RESUME_FLOW(params: any) {
  nvLog('AT', `▶️ FA_SEARCH_RESUME_FLOW 시작`, params);

  try {
    const result = await QA_SEARCH_RESUMES(params);

    return {
      success: result.success,
      data: result.data,
      message: result.success ? '검색 완료' : result.error || '검색 실패'
    };
  } catch (error: any) {
    nvLog('AT', '❌ FA_SEARCH_RESUME_FLOW 에러', error);
    return { success: false, message: error.message };
  }
}
