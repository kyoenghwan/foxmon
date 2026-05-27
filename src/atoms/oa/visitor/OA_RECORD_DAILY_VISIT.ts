import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';
import type { StandardResult } from '@/src/atoms/da/common/DA_COMMON_ERROR_TYPES';

export const OA_RECORD_DAILY_VISIT = async (input: { ipAddress: string }): Promise<StandardResult<void>> => {
  nvLog('AT', '▶️ OA_RECORD_DAILY_VISIT 시작', input);
  try {
    const supabase = await createClient();
    const krDate = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayStr = krDate.toISOString().split('T')[0];
    
    // upsert와 onConflict를 활용해 동일 날짜 + 동일 IP 중복 인서트 방지
    const { error } = await supabase
      .from('daily_visitors')
      .upsert(
        { visit_date: todayStr, ip_address: input.ipAddress },
        { onConflict: 'visit_date,ip_address', ignoreDuplicates: true }
      );

    if (error) {
      nvLog('AT', '⚠️ OA_RECORD_DAILY_VISIT DB 기록 실패 (테이블 미생성 가능성)', error);
      // DB 테이블이 아직 없을 때도 전체 앱이 정지되지 않도록 예외 처리
      return { success: true };
    }
    return { success: true };
  } catch (error: any) {
    nvLog('AT', '❌ OA_RECORD_DAILY_VISIT 예외 발생', error);
    return { success: false, errorCode: 'INTERNAL_ERROR', message: '방문 기록 실패' };
  }
};
