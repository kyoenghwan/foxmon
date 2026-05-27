import { OA_RECORD_DAILY_VISIT } from '@/src/atoms/oa/visitor/OA_RECORD_DAILY_VISIT';
import { QA_GET_DAILY_VISITOR_COUNT } from '@/src/atoms/qa/visitor/QA_GET_DAILY_VISITOR_COUNT';
import { nvLog } from '@/lib/logger';
import type { StandardResult } from '@/src/atoms/da/common/DA_COMMON_ERROR_TYPES';

export const FA_RECORD_AND_GET_VISITORS = async (input: { ipAddress: string }): Promise<StandardResult<number>> => {
  nvLog('AT', '▶️ FA_RECORD_AND_GET_VISITORS 시작', input);
  try {
    // 1. 클라이언트 IP 정보가 있다면 방문 기록 추가 (중복 방지 내장)
    if (input.ipAddress && input.ipAddress.trim() !== '') {
      await OA_RECORD_DAILY_VISIT({ ipAddress: input.ipAddress });
    }
    
    // 2. 당일 전체 고유 방문자 수 집계 결과 조회
    const countResult = await QA_GET_DAILY_VISITOR_COUNT();
    return countResult;
  } catch (error: any) {
    nvLog('AT', '❌ FA_RECORD_AND_GET_VISITORS 예외 발생', error);
    return { success: false, errorCode: 'INTERNAL_ERROR', message: '방문자 처리 통합 플로우 오류' };
  }
};
