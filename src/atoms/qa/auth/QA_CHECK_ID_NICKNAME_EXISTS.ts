import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * QA_CHECK_ID_NICKNAME_EXISTS: 로그인 아이디 또는 닉네임의 중복 여부를 확인합니다.
 */
export async function QA_CHECK_ID_NICKNAME_EXISTS(input: { loginId?: string; nickname?: string }): Promise<{ 
  idExists: boolean; 
  nicknameExists: boolean; 
  error: string | null 
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
      
      if (idError) throw idError;
      idExists = !!idData;
    }

    if (input.nickname) {
      const { data: nickData, error: nickError } = await supabase
        .from('users')
        .select('nickname')
        .eq('nickname', input.nickname)
        .maybeSingle();

      if (nickError) throw nickError;
      nicknameExists = !!nickData;
    }

    return { idExists, nicknameExists, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ QA_CHECK_ID_NICKNAME_EXISTS 에러', err.message);
    return { idExists: false, nicknameExists: false, error: err.message };
  }
}
