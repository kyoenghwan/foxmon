import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * QA_GET_USER_AUTH_BY_ID: 사용자 인증 정보(비밀번호 포함)를 ID로 조회합니다.
 * Domain: Auth
 * Type: Query Atom (Read-only)
 */
export async function QA_GET_USER_AUTH_BY_ID(input: { userId: string }): Promise<{ 
  success: boolean; 
  data: { password: any } | null; 
  error: string | null 
}> {
  nvLog('AT', '▶️ QA_GET_USER_AUTH_BY_ID 시작', { userId: input.userId });
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('password')
      .eq('id', input.userId)
      .single();

    if (error) {
       nvLog('AT', '❌ QA_GET_USER_AUTH_BY_ID 에러', error);
       return { success: false, data: null, error: error.message };
    }

    nvLog('AT', '✅ QA_GET_USER_AUTH_BY_ID 성공');
    return { success: true, data, error: null };
  } catch (error: any) {
    nvLog('AT', '❌ QA_GET_USER_AUTH_BY_ID 시스템 에러', error);
    return { success: false, data: null, error: error.message };
  }
}
