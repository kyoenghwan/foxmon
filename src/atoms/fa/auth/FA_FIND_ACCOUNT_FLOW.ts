import { nvLog } from '@/lib/logger';
import { QA_FIND_USER_BY_INFO } from '../../qa/auth/QA_FIND_USER_BY_INFO';
import { OA_RESET_USER_PASSWORD } from '../../oa/auth/OA_RESET_USER_PASSWORD';

interface FindAccountFlowInput {
  mode: 'FIND_ID' | 'RESET_PW';
  name: string;
  phoneNumber: string;
  loginId?: string;
  newPassword?: string;
}

export async function FA_FIND_ACCOUNT_FLOW({ mode, name, phoneNumber, loginId, newPassword }: FindAccountFlowInput) {
  nvLog('AT', '▶️ FA_FIND_ACCOUNT_FLOW 시작', { mode, name });

  try {
    // 1. Find User by Info
    const lookupResult = await QA_FIND_USER_BY_INFO({ name, phoneNumber });

    if (!lookupResult.success || !lookupResult.data) {
      return { success: false, message: '일치하는 사용자 정보가 없습니다.' };
    }

    const userData = lookupResult.data;

    // 2. Mode-specific Logic
    if (mode === 'FIND_ID') {
      nvLog('AT', '✅ FA_FIND_ACCOUNT_FLOW 완료 (ID 찾기)');
      return { 
        success: true, 
        message: '사용자님의 아이디를 찾았습니다.',
        data: { maskedId: userData.maskedId } 
      };
    }

    if (mode === 'RESET_PW') {
      // For password reset, also verify loginId matches
      if (loginId && userData.loginId !== loginId) {
        return { success: false, message: '입력하신 아이디와 사용자 정보가 일치하지 않습니다.' };
      }

      if (!newPassword) {
        return { success: false, message: '새로운 비밀번호를 입력해주세요.' };
      }

      // Perform reset
      const resetResult = await OA_RESET_USER_PASSWORD({ 
        userId: userData.id, 
        newPassword 
      });

      if (!resetResult.success) {
        return { success: false, message: resetResult.message };
      }

      nvLog('AT', '✅ FA_FIND_ACCOUNT_FLOW 완료 (비밀번호 재설정)');
      return { success: true, message: '비밀번호가 성공적으로 재설정되었습니다. 새로운 비밀번호로 로그인해주세요.' };
    }

    return { success: false, message: '유효하지 않은 요청 모드입니다.' };
  } catch (err) {
    nvLog('AT', '❌ FA_FIND_ACCOUNT_FLOW 시스템 에러', err);
    return { success: false, message: '요청 처리 중 오류가 발생했습니다.' };
  }
}
