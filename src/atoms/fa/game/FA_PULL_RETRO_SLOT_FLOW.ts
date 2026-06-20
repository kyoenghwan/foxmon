import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { GAME_COSTS } from '../../ca/game/CA_GAME_CONFIG';
import { OA_PULL_RETRO_SLOT, OA_PULL_RETRO_SLOT_ROLLBACK } from '../../oa/game/OA_PULL_RETRO_SLOT';
import { OA_INITIALIZE_RETRO_BOARD } from '../../oa/game/OA_INITIALIZE_RETRO_BOARD';
import { QA_GET_DAILY_GAME_STATUS } from '../../qa/game/QA_GET_DAILY_GAME_STATUS';
import { OA_RECORD_GAME_PARTICIPATION, OA_RECORD_GAME_PARTICIPATION_ROLLBACK } from '../../oa/game/OA_RECORD_GAME_PARTICIPATION';
import type { AtomErrorCode, StandardResult } from '../../da/common/DA_COMMON_ERROR_TYPES';

export type PullRetroSlotInput = {
  userId: string;
  boardRound: number;
  slotNumber: number;
};

export type PullRetroSlotFlowResult = {
  slotNumber: number;
  rewardAmount: number;
  rewardTier: number;
  newBoardOpened: boolean;
  balanceAfter: number;
  isFree: boolean;
};

export async function FA_PULL_RETRO_SLOT_FLOW(
  input: PullRetroSlotInput
): Promise<StandardResult<PullRetroSlotFlowResult>> {
  nvLog('AT', '▶️ FA_PULL_RETRO_SLOT_FLOW 시작', input);

  if (!input.userId || !input.boardRound || !input.slotNumber) {
    return {
      success: false,
      errorCode: 'VALIDATION_FAILED',
      message: '필수 매개변수가 누락되었습니다.',
    };
  }

  const completedOAs: Array<() => Promise<void>> = [];

  try {
    // 0-1. 마감시간 서버 측 검증 (KST 23:55 ~ 23:59 뽑기 차단)
    const kstOffset = 9 * 60 * 60 * 1000;
    const nowKst = new Date(Date.now() + kstOffset);
    const h = nowKst.getUTCHours();
    const m = nowKst.getUTCMinutes();
    if (h === 23 && m >= 55) {
      return {
        success: false,
        errorCode: 'PERMISSION_DENIED' as AtomErrorCode,
        message: '오늘의 뽑기 시간이 마감되었습니다. (23:55 마감) 내일 00:00에 다시 시작됩니다!',
      };
    }

    // 0-2. 오늘 무료 기회 확인
    const statusResult = await QA_GET_DAILY_GAME_STATUS({ userId: input.userId });
    if (!statusResult.success || !statusResult.data) {
      return {
        success: false,
        errorCode: statusResult.errorCode || 'INTERNAL_ERROR',
        message: statusResult.message || '오늘 참여 상태를 확인하는 데 실패했습니다.',
      };
    }

    const isFree = !statusResult.data.retroPlayed;
    const cost = isFree ? 0 : GAME_COSTS.RETRO_DRAW;

    // 1. 유저 보유 포인트 조회 및 비용 검증
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('activity_points')
      .eq('id', input.userId)
      .single();

    if (userErr || !user) {
      return {
        success: false,
        errorCode: 'NOT_FOUND',
        message: '사용자 정보를 불러올 수 없습니다.',
      };
    }

    let currentBalance = Number(user.activity_points);
    if (!isFree && currentBalance < cost) {
      return {
        success: false,
        errorCode: 'PERMISSION_DENIED',
        message: `포인트가 부족합니다. (뽑기 비용: ${cost}p, 보유: ${currentBalance}p)`,
      };
    }

    // 2. 포인트 차감 (무료가 아닐 때만)
    if (!isFree && cost > 0) {
      const { data: deductRes, error: deductErr } = await supabaseAdmin.rpc('process_activity_point', {
        p_user_id: input.userId,
        p_type: 'GAME_COST',
        p_amount: -cost,
        p_description: `추억의 뽑기판 ${input.slotNumber}번 딱지 뽑기 차감`,
      });

      if (deductErr || !deductRes?.success) {
        nvLog('AT', '❌ FA_PULL_RETRO_SLOT_FLOW 포인트 차감 RPC 에러', { deductErr, deductRes });
        return {
          success: false,
          errorCode: 'INTERNAL_ERROR',
          message: deductRes?.message || '포인트 차감 처리에 실패했습니다.',
        };
      }

      currentBalance = Number(deductRes.balance_after);

      // 롤백 예약: 차감 포인트 복구
      completedOAs.push(async () => {
        await supabaseAdmin.rpc('process_activity_point', {
          p_user_id: input.userId,
          p_type: 'ADMIN_ADJUST',
          p_amount: cost,
          p_description: `[ROLLBACK] 뽑기 비용 복구 (${input.slotNumber}번)`,
        });
      });
    }

    // 3. 딱지 선점 및 당첨 결과 획득 (DB 조건부 업데이트로 동시성 방어)
    const pullResult = await OA_PULL_RETRO_SLOT({
      userId: input.userId,
      boardRound: input.boardRound,
      slotNumber: input.slotNumber,
    });

    if (!pullResult.success || !pullResult.data) {
      throw pullResult; // 실패 시 에러 던짐 -> 캐치 블록에서 롤백
    }

    const { rewardAmount, rewardTier } = pullResult.data;

    // 롤백 예약: 딱지 선점 상태 취소
    completedOAs.push(async () => {
      await OA_PULL_RETRO_SLOT_ROLLBACK(pullResult.rollbackData);
    });

    // 4. 당첨금 적립 (0보다 큰 경우에만)
    if (rewardAmount > 0) {
      const { data: rewardRes, error: rewardErr } = await supabaseAdmin.rpc('process_activity_point', {
        p_user_id: input.userId,
        p_type: 'GAME_REWARD',
        p_amount: rewardAmount,
        p_description: `추억의 뽑기판 ${input.slotNumber}번 당첨 적립 (Tier: ${rewardTier})`,
      });

      if (rewardErr || !rewardRes?.success) {
        nvLog('AT', '❌ FA_PULL_RETRO_SLOT_FLOW 포인트 적립 RPC 에러', { rewardErr, rewardRes });
        throw { errorCode: 'INTERNAL_ERROR', message: '당첨 포인트 적립에 실패했습니다.' };
      }

      currentBalance = Number(rewardRes.balance_after);

      // 롤백 예약: 당첨금 회수
      completedOAs.push(async () => {
        await supabaseAdmin.rpc('process_activity_point', {
          p_user_id: input.userId,
          p_type: 'ADMIN_ADJUST',
          p_amount: -rewardAmount,
          p_description: `[ROLLBACK] 뽑기 당첨금 회수 (${input.slotNumber}번)`,
        });
      });
    }

    // 4.5 오늘 무료 기회를 쓴 경우 참여 로그 작성
    if (isFree) {
      const logResult = await OA_RECORD_GAME_PARTICIPATION({
        userId: input.userId,
        gameType: 'RETRO_DRAW',
        rewardAmount: rewardAmount,
      });

      if (!logResult.success) {
        throw logResult;
      }

      // 롤백 예약: 참여 로그 삭제
      completedOAs.push(async () => {
        await OA_RECORD_GAME_PARTICIPATION_ROLLBACK(logResult.rollbackData);
      });
    }

    // 5. 완판 여부 확인 및 리셋 트리거
    let newBoardOpened = false;

    // 현재 보드에 남은 미점유 슬롯 카운트
    const { count, error: countErr } = await supabaseAdmin
      .from('retro_draw_slots')
      .select('id', { count: 'exact', head: true })
      .eq('board_round', input.boardRound)
      .is('user_id', null);

    if (countErr) {
      nvLog('AT', '⚠️ FA_PULL_RETRO_SLOT_FLOW 남은 슬롯 카운트 실패', countErr);
    } else if (count === 0) {
      nvLog('AT', '🎉 완판 감지! 새로운 판 개설을 시작합니다.', { boardRound: input.boardRound });
      const initResult = await OA_INITIALIZE_RETRO_BOARD({ currentBoardRound: input.boardRound });
      if (initResult.success) {
        newBoardOpened = true;
      } else {
        nvLog('AT', '❌ FA_PULL_RETRO_SLOT_FLOW 새 보드 자동 개설 실패', initResult.message);
      }
    }

    return {
      success: true,
      data: {
        slotNumber: input.slotNumber,
        rewardAmount,
        rewardTier,
        newBoardOpened,
        balanceAfter: currentBalance,
        isFree,
      },
    };
  } catch (err: any) {
    nvLog('AT', '❌ FA_PULL_RETRO_SLOT_FLOW 에러 감지, 롤백 실행', err);
    for (const rollback of completedOAs.reverse()) {
      try {
        await rollback();
      } catch (rErr) {
        nvLog('AT', '❌ FA_PULL_RETRO_SLOT_FLOW 롤백 과정 에러', rErr);
      }
    }

    return {
      success: false,
      errorCode: err.errorCode || 'INTERNAL_ERROR',
      message: err.message || '뽑기 처리 중 오류가 발생하여 안전하게 복구되었습니다.',
    };
  }
}
