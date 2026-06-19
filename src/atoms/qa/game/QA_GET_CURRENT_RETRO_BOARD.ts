import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode } from '../../da/common/DA_COMMON_ERROR_TYPES';

export type RetroSlotInfo = {
  id: string;
  slotNumber: number;
  isPulled: boolean;
  rewardAmount?: number; // 뽑힌 경우에만 실제 값 전달
  rewardTier?: number;   // 뽑힌 경우에만 실제 값 전달
  userNickname?: string; // 뽑은 사람 닉네임 (있다면)
};

export type RetroBoardStatus = {
  boardRound: number;
  isCompleted: boolean;
  slots: RetroSlotInfo[];
};

export async function QA_GET_CURRENT_RETRO_BOARD(): Promise<{
  success: boolean;
  data?: RetroBoardStatus | null;
  message?: string;
  errorCode?: AtomErrorCode;
}> {
  nvLog('AT', '▶️ QA_GET_CURRENT_RETRO_BOARD 시작');

  try {
    // 1. 현재 완료되지 않은 (is_completed = false) 가장 최신 보드 조회
    const { data: board, error: boardErr } = await supabaseAdmin
      .from('retro_draw_board')
      .select('*')
      .eq('is_completed', false)
      .order('board_round', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (boardErr) {
      nvLog('AT', '❌ QA_GET_CURRENT_RETRO_BOARD 회차 조회 에러', boardErr);
      return { success: false, errorCode: 'INTERNAL_ERROR', message: '뽑기판 회차 정보를 조회하는 데 실패했습니다.' };
    }

    if (!board) {
      // 진행 중인 뽑기판이 없는 경우 (새 판 개설 필요함을 명시)
      return {
        success: true,
        data: null
      };
    }

    // 2. 해당 회차의 100개 슬롯 정보 전체 가져오기
    const { data: slots, error: slotsErr } = await supabaseAdmin
      .from('retro_draw_slots')
      .select('id, slot_number, reward_amount, reward_tier, user_id, users(nickname)')
      .eq('board_round', board.board_round)
      .order('slot_number', { ascending: true });

    if (slotsErr) {
      nvLog('AT', '❌ QA_GET_CURRENT_RETRO_BOARD 슬롯 조회 에러', slotsErr);
      return { success: false, errorCode: 'INTERNAL_ERROR', message: '뽑기판 쪽지 정보를 조회하는 데 실패했습니다.' };
    }

    // 3. 보안 필터링 적용: 아직 안 뜯은 슬롯(user_id === null)의 보상 액수와 등수는 프론트 전송 전에 숨김 처리
    const maskedSlots: RetroSlotInfo[] = (slots || []).map((slot: any) => {
      const isPulled = !!slot.user_id;
      return {
        id: slot.id,
        slotNumber: slot.slot_number,
        isPulled,
        // 뽑힌 경우에만 실제 당첨금 및 등수 전달 (F12 스니핑 방지)
        rewardAmount: isPulled ? Number(slot.reward_amount) : undefined,
        rewardTier: isPulled ? Number(slot.reward_tier) : undefined,
        userNickname: isPulled ? (slot.users?.nickname || '익명회원') : undefined
      };
    });

    return {
      success: true,
      data: {
        boardRound: board.board_round,
        isCompleted: board.is_completed,
        slots: maskedSlots
      }
    };
  } catch (err: any) {
    nvLog('AT', '❌ QA_GET_CURRENT_RETRO_BOARD 예외', err);
    return { success: false, errorCode: 'INTERNAL_ERROR', message: err.message || '시스템 오류가 발생했습니다.' };
  }
}
