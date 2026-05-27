import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';
import type { StandardResult } from '@/src/atoms/da/common/DA_COMMON_ERROR_TYPES';

export const QA_GET_DAILY_VISITOR_COUNT = async (): Promise<StandardResult<number>> => {
  nvLog('AT', '▶️ QA_GET_DAILY_VISITOR_COUNT 시작');
  try {
    const supabase = await createClient();
    // UTC 기준이 아닌 한국 시간(KST, UTC+9) 기준으로 오늘 날짜 문자열 획득
    const krDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayStr = krDate.toISOString().split('T')[0];
    
    const { count, error } = await supabase
      .from('daily_visitors')
      .select('*', { count: 'exact', head: true })
      .eq('visit_date', todayStr);

    if (error) {
      nvLog('AT', '⚠️ QA_GET_DAILY_VISITOR_COUNT DB 조회 실패 (테이블 미생성 가능성)', error);
      // 테이블이 아직 없어도 메인 게이트웨이가 뻗지 않도록 0명으로 유연하게 방어 처리
      return { success: true, data: 0 };
    }
    return { success: true, data: count ?? 0 };
  } catch (error: any) {
    nvLog('AT', '❌ QA_GET_DAILY_VISITOR_COUNT 예외 발생', error);
    return { success: false, errorCode: 'INTERNAL_ERROR', message: '방문자 수 조회 실패' };
  }
};
