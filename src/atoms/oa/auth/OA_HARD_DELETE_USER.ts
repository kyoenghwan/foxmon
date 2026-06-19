import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode } from '../../da/common/DA_COMMON_ERROR_TYPES';

export async function OA_HARD_DELETE_USER(input: {
  userId: string;
}): Promise<{
  success: boolean;
  message?: string;
  errorCode?: AtomErrorCode;
  rollbackData?: any;
}> {
  nvLog('AT', '▶️ OA_HARD_DELETE_USER 시작', { userId: input.userId });

  if (!input.userId) {
    return { success: false, errorCode: 'VALIDATION_FAILED', message: '사용자 ID가 누락되었습니다.' };
  }

  let previousState = null;

  try {
    // 롤백용 백업
    const { data: userBackup, error: backupError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', input.userId)
      .maybeSingle();

    if (backupError) throw backupError;
    if (!userBackup) {
      return { success: false, errorCode: 'NOT_FOUND', message: '삭제할 사용자를 찾을 수 없습니다.' };
    }

    previousState = userBackup;

    // 실제 삭제 실행
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', input.userId);

    if (deleteError) throw deleteError;

    return {
      success: true,
      rollbackData: { previousState, userId: input.userId }
    };
  } catch (err: any) {
    nvLog('AT', '❌ OA_HARD_DELETE_USER 에러', err);
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: err.message || '회원 정보 물리 삭제에 실패했습니다.',
      rollbackData: { previousState }
    };
  }
}

// 롤백 함수 (삭제 복구)
export async function OA_HARD_DELETE_USER_ROLLBACK(rollbackData: any): Promise<{ success: boolean }> {
  nvLog('AT', '🔄 OA_HARD_DELETE_USER_ROLLBACK 시작', { userId: rollbackData?.userId });
  if (!rollbackData || !rollbackData.previousState) return { success: true };

  try {
    // 백업된 정보 그대로 재삽입
    const { error } = await supabaseAdmin
      .from('users')
      .insert(rollbackData.previousState);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    nvLog('AT', '❌ OA_HARD_DELETE_USER_ROLLBACK 실패', err);
    return { success: false };
  }
}
