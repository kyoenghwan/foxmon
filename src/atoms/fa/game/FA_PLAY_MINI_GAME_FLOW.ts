import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { GAME_COSTS, ROULETTE_REWARDS, LUCKY_BOX_REWARDS, GameRewardItem } from '../../ca/game/CA_GAME_CONFIG';
import { QA_GET_DAILY_GAME_STATUS } from '../../qa/game/QA_GET_DAILY_GAME_STATUS';
import { OA_RECORD_GAME_PARTICIPATION, OA_RECORD_GAME_PARTICIPATION_ROLLBACK } from '../../oa/game/OA_RECORD_GAME_PARTICIPATION';
import type { AtomErrorCode, StandardResult } from '../../da/common/DA_COMMON_ERROR_TYPES';

export type PlayMiniGameInput = {
  userId: string;
  gameType: 'ROULETTE' | 'LUCKY_BOX' | 'LOTTO';
};

export type PlayMiniGameResult = {
  gameType: 'ROULETTE' | 'LUCKY_BOX' | 'LOTTO';
  rewardAmount: number;
  label: string;
  lottoNumbers?: number[];
  isFree: boolean;
  balanceAfter: number;
};

// 가중치 추첨 함수
function drawReward(rewards: GameRewardItem[]): GameRewardItem {
  const totalWeight = rewards.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of rewards) {
    if (random < item.weight) {
      return item;
    }
    random -= item.weight;
  }
  return rewards[rewards.length - 1];
}

// 로또 번호 생성 함수 (1~45 중 6개)
function drawLottoNumbers(): number[] {
  const nums = new Set<number>();
  while (nums.size < 6) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(nums).sort((a, b) => a - b);
}

export async function FA_PLAY_MINI_GAME_FLOW(
  input: PlayMiniGameInput
): Promise<StandardResult<PlayMiniGameResult>> {
  nvLog('AT', '▶️ FA_PLAY_MINI_GAME_FLOW 시작', input);

  if (!input.userId || !input.gameType) {
    return {
      success: false,
      errorCode: 'VALIDATION_FAILED',
      message: '필수 매개변수가 누락되었습니다.',
    };
  }

  // Saga 롤백용 스택
  const completedOAs: Array<() => Promise<void>> = [];

  try {
    // 1. 오늘 참여 여부 확인
    const statusResult = await QA_GET_DAILY_GAME_STATUS({ userId: input.userId });
    if (!statusResult.success || !statusResult.data) {
      return {
        success: false,
        errorCode: statusResult.errorCode || 'INTERNAL_ERROR',
        message: statusResult.message || '오늘 참여 상태를 확인하는 데 실패했습니다.',
      };
    }

    let isFree = true;
    if (input.gameType === 'ROULETTE' && statusResult.data.roulettePlayed) isFree = false;
    if (input.gameType === 'LUCKY_BOX' && statusResult.data.luckyBoxPlayed) isFree = false;
    if (input.gameType === 'LOTTO' && statusResult.data.lottoPlayed) isFree = false;

    // 2. 유료 게임인 경우 포인트 차감
    let currentBalance = 0;
    const cost = GAME_COSTS[input.gameType];

    // 유저 현재 포인트 조회
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
    currentBalance = Number(user.activity_points);

    if (!isFree) {
      // 포인트 부족 검사
      if (currentBalance < cost) {
        return {
          success: false,
          errorCode: 'PERMISSION_DENIED',
          message: `포인트가 부족합니다. (게임 비용: ${cost}p, 보유: ${currentBalance}p)`,
        };
      }

      // 포인트 차감 RPC 호출
      const { data: deductRes, error: deductErr } = await supabaseAdmin.rpc('process_activity_point', {
        p_user_id: input.userId,
        p_type: 'GAME_COST',
        p_amount: -cost,
        p_description: `${input.gameType} 미니게임 참여 차감`,
      });

      if (deductErr || !deductRes?.success) {
        nvLog('AT', '❌ FA_PLAY_MINI_GAME_FLOW 포인트 차감 RPC 에러', { deductErr, deductRes });
        return {
          success: false,
          errorCode: 'INTERNAL_ERROR',
          message: deductRes?.message || '포인트 차감 처리에 실패했습니다.',
        };
      }

      currentBalance = Number(deductRes.balance_after);

      // 롤백 예약: 차감된 포인트 복구
      completedOAs.push(async () => {
        await supabaseAdmin.rpc('process_activity_point', {
          p_user_id: input.userId,
          p_type: 'ADMIN_ADJUST',
          p_amount: cost,
          p_description: `[ROLLBACK] ${input.gameType} 비용 복구`,
        });
      });
    }

    // 3. 당첨 및 결과 결정
    let rewardAmount = 0;
    let label = '';
    let lottoNumbers: number[] | undefined;

    if (input.gameType === 'LOTTO') {
      lottoNumbers = drawLottoNumbers();
      rewardAmount = 10; // 로또 발급 보너스 10p 고정
      label = `로또 번호 발급 보너스 (숫자: ${lottoNumbers.join(', ')})`;
    } else {
      const pool = input.gameType === 'ROULETTE' ? ROULETTE_REWARDS : LUCKY_BOX_REWARDS;
      const drawn = drawReward(pool);
      rewardAmount = drawn.amount;
      label = drawn.label;
    }

    // 4. 보상 포인트 적립 (당첨금이 있는 경우만)
    if (rewardAmount > 0) {
      const { data: rewardRes, error: rewardErr } = await supabaseAdmin.rpc('process_activity_point', {
        p_user_id: input.userId,
        p_type: 'GAME_REWARD',
        p_amount: rewardAmount,
        p_description: `${input.gameType} 미니게임 당첨 적립 (${label})`,
      });

      if (rewardErr || !rewardRes?.success) {
        nvLog('AT', '❌ FA_PLAY_MINI_GAME_FLOW 포인트 적립 RPC 에러', { rewardErr, rewardRes });
        throw { errorCode: 'INTERNAL_ERROR', message: '보상 포인트 적립에 실패했습니다.' };
      }

      currentBalance = Number(rewardRes.balance_after);

      // 롤백 예약: 적립된 보상 포인트 회수
      completedOAs.push(async () => {
        await supabaseAdmin.rpc('process_activity_point', {
          p_user_id: input.userId,
          p_type: 'ADMIN_ADJUST',
          p_amount: -rewardAmount,
          p_description: `[ROLLBACK] ${input.gameType} 당첨금 회수`,
        });
      });
    }

    // 5. 게임 참여 로그 저장
    const logResult = await OA_RECORD_GAME_PARTICIPATION({
      userId: input.userId,
      gameType: input.gameType,
      rewardAmount,
    });

    if (!logResult.success) {
      throw logResult;
    }

    // 롤백 예약: 참여 로그 삭제
    completedOAs.push(async () => {
      await OA_RECORD_GAME_PARTICIPATION_ROLLBACK(logResult.rollbackData);
    });

    return {
      success: true,
      data: {
        gameType: input.gameType,
        rewardAmount,
        label,
        lottoNumbers,
        isFree,
        balanceAfter: currentBalance,
      },
    };
  } catch (err: any) {
    nvLog('AT', '❌ FA_PLAY_MINI_GAME_FLOW 에러 감지, 롤백 실행', err);
    // Saga 패턴 역순 롤백 실행
    for (const rollback of completedOAs.reverse()) {
      try {
        await rollback();
      } catch (rErr) {
        nvLog('AT', '❌ FA_PLAY_MINI_GAME_FLOW 롤백 과정 중 에러 발생', rErr);
      }
    }

    return {
      success: false,
      errorCode: err.errorCode || 'INTERNAL_ERROR',
      message: err.message || '미니게임 처리 중 오류가 발생하여 안전하게 복구되었습니다.',
    };
  }
}
