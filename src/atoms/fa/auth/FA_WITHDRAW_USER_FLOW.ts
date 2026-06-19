import { OA_UPSERT_CI_HISTORY, OA_UPSERT_CI_HISTORY_ROLLBACK } from '@/src/atoms/oa/auth/OA_UPSERT_CI_HISTORY';
import { OA_HARD_DELETE_USER, OA_HARD_DELETE_USER_ROLLBACK } from '@/src/atoms/oa/auth/OA_HARD_DELETE_USER';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode } from '../../da/common/DA_COMMON_ERROR_TYPES';

export async function FA_WITHDRAW_USER_FLOW(input: {
  userId: string;
}): Promise<{
  success: boolean;
  message: string;
  errorCode?: AtomErrorCode;
}> {
  nvLog('AT', '▶️ FA_WITHDRAW_USER_FLOW 시작', { userId: input.userId });

  if (!input.userId) {
    return { success: false, message: '사용자 정보가 누락되었습니다.', errorCode: 'VALIDATION_FAILED' };
  }

  const completedOAs: Array<() => Promise<void>> = [];

  try {
    // Step 1: 유저 정보에서 CI 조회
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('ci')
      .eq('id', input.userId)
      .maybeSingle();

    if (userErr || !user) {
      return { success: false, message: '사용자 정보를 찾을 수 없습니다.', errorCode: 'NOT_FOUND' };
    }

    const userCi = user.ci;

    // Step 2: CI가 있으면 탈퇴 이력 기록 (재가입 방지 테이블 갱신)
    if (userCi) {
      const upsertResult = await OA_UPSERT_CI_HISTORY({
        ci: userCi,
        action: 'WITHDRAW'
      });

      if (!upsertResult.success) {
        throw upsertResult;
      }
      
      completedOAs.push(async () => {
        await OA_UPSERT_CI_HISTORY_ROLLBACK(upsertResult.rollbackData);
      });
    }

    // Step 3: 사용자 물리 계정 삭제
    const deleteResult = await OA_HARD_DELETE_USER({
      userId: input.userId
    });

    if (!deleteResult.success) {
      throw deleteResult;
    }

    completedOAs.push(async () => {
      await OA_HARD_DELETE_USER_ROLLBACK(deleteResult.rollbackData);
    });

    nvLog('AT', '✅ FA_WITHDRAW_USER_FLOW 완료', { userId: input.userId });
    return { success: true, message: '회원 탈퇴가 완료되었습니다.' };

  } catch (err: any) {
    nvLog('AT', '❌ FA_WITHDRAW_USER_FLOW 에러 발생 - 롤백 처리 시작', err);
    // 역순 롤백 실행
    for (const rollback of completedOAs.reverse()) {
      await rollback();
    }
    return {
      success: false,
      message: err.message || '회원 탈퇴 처리 중 시스템 오류가 발생했습니다.',
      errorCode: err.errorCode || 'INTERNAL_ERROR'
    };
  }
}
