import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode, StandardResult } from '../../da/common/DA_COMMON_ERROR_TYPES';

export type PullRetroSlotResult = {
  id: string;
  rewardAmount: number;
  rewardTier: number;
};

export async function OA_PULL_RETRO_SLOT(input: {
  userId: string;
  boardRound: number;
  slotNumber: number;
}): Promise<StandardResult<PullRetroSlotResult>> {
  nvLog('AT', '▶️ OA_PULL_RETRO_SLOT 시작', input);

  if (!input.userId || !input.boardRound || !input.slotNumber) {
    return {
      success: false,
      errorCode: 'VALIDATION_FAILED',
      message: '필수 매개변수가 누락되었습니다.',
    };
  }

  try {
    // user_id가 null인 특정 슬롯만 업데이트하여 동시성 제어 (낙관적/조건부 락)
    const { data, error } = await supabaseAdmin
      .from('retro_draw_slots')
      .update({
        user_id: input.userId,
        pulled_at: new Date().toISOString(),
      })
      .eq('board_round', input.boardRound)
      .eq('slot_number', input.slotNumber)
      .is('user_id', null)
      .select('id, reward_amount, reward_tier')
      .maybeSingle();

    if (error) {
      nvLog('AT', '❌ OA_PULL_RETRO_SLOT 에러', error);
      return {
        success: false,
        errorCode: 'INTERNAL_ERROR',
        message: '뽑기 처리 중 데이터베이스 오류가 발생했습니다.',
      };
    }

    if (!data) {
      nvLog('AT', '⚠️ OA_PULL_RETRO_SLOT 선점 실패 (이미 뽑힘)', input);
      return {
        success: false,
        errorCode: 'CONFLICT',
        message: '이미 다른 사용자가 뽑은 쪽지입니다.',
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        rewardAmount: Number(data.reward_amount),
        rewardTier: Number(data.reward_tier),
      },
      rollbackData: {
        slotId: data.id,
      },
    };
  } catch (err: any) {
    nvLog('AT', '❌ OA_PULL_RETRO_SLOT 예외', err);
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: err.message || '시스템 예외가 발생했습니다.',
    };
  }
}

// 롤백 함수: 딱지 선점 상태 취소
export async function OA_PULL_RETRO_SLOT_ROLLBACK(rollbackData: any): Promise<StandardResult<void>> {
  nvLog('AT', '🔄 OA_PULL_RETRO_SLOT_ROLLBACK 시작', rollbackData);
  if (!rollbackData || !rollbackData.slotId) {
    return { success: true };
  }

  try {
    const { error } = await supabaseAdmin
      .from('retro_draw_slots')
      .update({
        user_id: null,
        pulled_at: null,
      })
      .eq('id', rollbackData.slotId);

    if (error) {
      nvLog('AT', '❌ OA_PULL_RETRO_SLOT_ROLLBACK 실패', error);
      return { success: false, errorCode: 'INTERNAL_ERROR', message: '롤백 업데이트 실패' };
    }

    return { success: true };
  } catch (err) {
    nvLog('AT', '❌ OA_PULL_RETRO_SLOT_ROLLBACK 예외', err);
    return { success: false, errorCode: 'INTERNAL_ERROR' };
  }
}
