import { QA_GET_ALL_USERS } from '../../qa/admin/QA_GET_ALL_USERS';
import { nvLog } from '../../../../lib/logger';

export async function FA_ADMIN_USER_FLOW(actionType: 'GET_ALL_USERS') {
  nvLog('AT', `▶️ FA_ADMIN_USER_FLOW 시작 [${actionType}]`);

  try {
    if (actionType === 'GET_ALL_USERS') {
      const result = await QA_GET_ALL_USERS();
      return {
        success: result.success,
        data: result.data,
        message: result.success ? '전체 사용자 조회 완료' : result.error || '조회 실패'
      };
    }
    
    return { success: false, message: 'Invalid actionType' };
  } catch (error: any) {
    nvLog('AT', '❌ FA_ADMIN_USER_FLOW 에러', error);
    return { success: false, message: error.message };
  }
}
