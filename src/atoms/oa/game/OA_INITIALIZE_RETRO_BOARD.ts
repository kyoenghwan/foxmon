import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode, StandardResult } from '../../da/common/DA_COMMON_ERROR_TYPES';

export async function OA_INITIALIZE_RETRO_BOARD(input: {
  currentBoardRound?: number;
}): Promise<StandardResult<{ newBoardRound: number }>> {
  nvLog('AT', '▶️ OA_INITIALIZE_RETRO_BOARD 시작', input);

  try {
    // 1. 기존 진행 중이던 라운드가 지정되었고, 그것이 완료되지 않았다면 완료 처리
    if (input.currentBoardRound) {
      const { error: updateErr } = await supabaseAdmin
        .from('retro_draw_board')
        .update({ is_completed: true })
        .eq('board_round', input.currentBoardRound);

      if (updateErr) {
        nvLog('AT', '❌ OA_INITIALIZE_RETRO_BOARD 기존 보드 완료 처리 실패', updateErr);
        return {
          success: false,
          errorCode: 'INTERNAL_ERROR',
          message: '기존 뽑기판의 완료 처리에 실패했습니다.',
        };
      }
    }

    // 2. RPC 함수 호출하여 새 보드 생성 및 100개 슬롯 셔플 초기화
    const { data: newRound, error: rpcErr } = await supabaseAdmin.rpc('initialize_retro_board_round');

    if (rpcErr) {
      nvLog('AT', '❌ OA_INITIALIZE_RETRO_BOARD RPC 에러', rpcErr);
      return {
        success: false,
        errorCode: 'INTERNAL_ERROR',
        message: '새로운 뽑기판을 생성하는 데 실패했습니다.',
      };
    }

    const newBoardRound = Number(newRound);
    nvLog('AT', '✅ OA_INITIALIZE_RETRO_BOARD 완료', { newBoardRound });

    return {
      success: true,
      data: {
        newBoardRound,
      },
    };
  } catch (err: any) {
    nvLog('AT', '❌ OA_INITIALIZE_RETRO_BOARD 예외', err);
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: err.message || '시스템 예외가 발생했습니다.',
    };
  }
}
