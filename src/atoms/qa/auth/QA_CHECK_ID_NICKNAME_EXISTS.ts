import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * QA_CHECK_ID_NICKNAME_EXISTS: 로그인 아이디 또는 닉네임의 중복 여부를 확인합니다.
 */
export async function QA_CHECK_ID_NICKNAME_EXISTS(input: { loginId?: string; nickname?: string }): Promise<{ 
  success: boolean;
  data: { idExists: boolean; nicknameExists: boolean } | null; 
  error: string | null;
}> {
  nvLog('AT', '▶️ QA_CHECK_ID_NICKNAME_EXISTS 시작', input);
  
  try {
    let idExists = false;
    let nicknameExists = false;

    if (input.loginId) {
      const { data: idData, error: idError } = await supabase
        .from('users')
        .select('login_id')
        .eq('login_id', input.loginId)
        .maybeSingle();
      
      if (idError) {
         nvLog('AT', '❌ QA_CHECK_ID_NICKNAME_EXISTS (ID check) 에러', idError.message);
         return { success: false, data: null, error: idError.message };
      }
      idExists = !!idData;
    }

    if (input.nickname) {
      const { data: nickData, error: nickError } = await supabase
        .from('users')
        .select('nickname')
        .eq('nickname', input.nickname)
        .maybeSingle();

      if (nickError) {
         nvLog('AT', '❌ QA_CHECK_ID_NICKNAME_EXISTS (Nickname check) 에러', nickError.message);
         return { success: false, data: null, error: nickError.message };
      }
      nicknameExists = !!nickData;
    }

    return { success: true, data: { idExists, nicknameExists }, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ QA_CHECK_ID_NICKNAME_EXISTS 시스템 에러', err.message);
    return { success: false, data: null, error: err.message };
  }
}
