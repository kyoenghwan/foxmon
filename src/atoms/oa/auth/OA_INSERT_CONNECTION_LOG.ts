import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import type { AtomErrorCode } from '../../da/common/DA_COMMON_ERROR_TYPES';

export async function OA_INSERT_CONNECTION_LOG(input: {
  userId: string;
  ipAddress: string;
  userAgent?: string;
}): Promise<{
  success: boolean;
  message?: string;
  errorCode?: AtomErrorCode;
}> {
  nvLog('AT', '▶️ OA_INSERT_CONNECTION_LOG 시작', { userId: input.userId, ipAddress: input.ipAddress });

  if (!input.userId || !input.ipAddress) {
    return { success: true }; // 중요 입력값이 없으면 에러를 내지 않고 우회 (로그인 흐름 보호)
  }

  try {
    const { error } = await supabaseAdmin
      .from('user_connection_logs')
      .insert({
        user_id: input.userId,
        ip_address: input.ipAddress,
        user_agent: input.userAgent || null
      });

    if (error) {
      nvLog('AT', '❌ OA_INSERT_CONNECTION_LOG 에러', error);
      // 로그인 접속기록 오류는 전체 로그인 흐름을 중단하지 않도록 내부 에러만 로깅하고 성공 반환
      return { success: true };
    }

    return { success: true };
  } catch (err: any) {
    nvLog('AT', '⚠️ OA_INSERT_CONNECTION_LOG 예외 발생 (무시)', err);
    return { success: true };
  }
}
