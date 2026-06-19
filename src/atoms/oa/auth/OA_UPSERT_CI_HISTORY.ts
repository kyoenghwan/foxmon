import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode } from '../../da/common/DA_COMMON_ERROR_TYPES';

export async function OA_UPSERT_CI_HISTORY(input: {
  ci: string;
  action: 'SIGNUP' | 'WITHDRAW' | 'MARK_USED';
}): Promise<{
  success: boolean;
  message?: string;
  errorCode?: AtomErrorCode;
  rollbackData?: any;
}> {
  nvLog('AT', '▶️ OA_UPSERT_CI_HISTORY 시작', { action: input.action, ci: input.ci ? '***' : null });

  if (!input.ci) {
    return { success: true }; // CI가 없으면 패스 (비본인인증 가입의 경우 대비)
  }

  let previousState = null;

  try {
    // 롤백용 이전 상태 보관
    const { data: existing } = await supabaseAdmin
      .from('user_ci_history_logs')
      .select('*')
      .eq('ci', input.ci)
      .maybeSingle();
      
    previousState = existing;

    if (input.action === 'SIGNUP') {
      if (existing) {
        // 재가입 처리
        const { error } = await supabaseAdmin
          .from('user_ci_history_logs')
          .update({
            last_registered_at: new Date().toISOString(),
            signup_count: (existing.signup_count || 1) + 1
          })
          .eq('ci', input.ci);

        if (error) throw error;
      } else {
        // 최초 가입 처리 (포인트 혜택 가능 상태로 시작)
        const { error } = await supabaseAdmin
          .from('user_ci_history_logs')
          .insert({
            ci: input.ci,
            first_registered_at: new Date().toISOString(),
            signup_count: 1,
            is_eligible_for_referral_points: true
          });

        if (error) throw error;
      }
    } else if (input.action === 'MARK_USED') {
      // 포인트가 지급 완료되어 혜택 비대상으로 갱신
      const { error } = await supabaseAdmin
        .from('user_ci_history_logs')
        .update({
          is_eligible_for_referral_points: false
        })
        .eq('ci', input.ci);

      if (error) throw error;
    } else if (input.action === 'WITHDRAW') {
      if (existing) {
        const { error } = await supabaseAdmin
          .from('user_ci_history_logs')
          .update({
            last_withdrawn_at: new Date().toISOString()
          })
          .eq('ci', input.ci);

        if (error) throw error;
      } else {
        // 이력이 없는데 탈퇴하는 경우 (이력 생성 후 탈퇴 기록)
        const { error } = await supabaseAdmin
          .from('user_ci_history_logs')
          .insert({
            ci: input.ci,
            first_registered_at: new Date().toISOString(), // 가짜 최초가입일 대체
            last_withdrawn_at: new Date().toISOString(),
            signup_count: 1,
            is_eligible_for_referral_points: false // 포인트 비대상 처리
          });

        if (error) throw error;
      }
    }

    return {
      success: true,
      rollbackData: { previousState, ci: input.ci, action: input.action }
    };
  } catch (err: any) {
    nvLog('AT', '❌ OA_UPSERT_CI_HISTORY 에러', err);
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: err.message || 'CI 이력 상태 변경에 실패했습니다.',
      rollbackData: { previousState }
    };
  }
}

// 롤백 함수
export async function OA_UPSERT_CI_HISTORY_ROLLBACK(rollbackData: any): Promise<{ success: boolean }> {
  nvLog('AT', '🔄 OA_UPSERT_CI_HISTORY_ROLLBACK 시작', { ci: rollbackData?.ci ? '***' : null });
  if (!rollbackData || !rollbackData.ci) return { success: true };

  try {
    if (rollbackData.previousState) {
      // 이전 상태로 복구
      await supabaseAdmin
        .from('user_ci_history_logs')
        .update(rollbackData.previousState)
        .eq('ci', rollbackData.ci);
    } else {
      // 새로 인서트했던 경우 지우기
      await supabaseAdmin
        .from('user_ci_history_logs')
        .delete()
        .eq('ci', rollbackData.ci);
    }
    return { success: true };
  } catch (err) {
    nvLog('AT', '❌ OA_UPSERT_CI_HISTORY_ROLLBACK 실패', err);
    return { success: false };
  }
}
