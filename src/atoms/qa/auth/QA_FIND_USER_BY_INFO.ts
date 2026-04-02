import { nvLog } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

interface FindUserByInfoInput {
  name: string;
  phoneNumber: string;
}

export async function QA_FIND_USER_BY_INFO({ name, phoneNumber }: FindUserByInfoInput) {
  nvLog('AT', '▶️ QA_FIND_USER_BY_INFO 시작', { name, phoneNumber });

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, login_id, name, phone_number')
      .eq('name', name)
      .eq('phone_number', phoneNumber)
      .single();

    if (error || !data) {
      nvLog('AT', '❌ QA_FIND_USER_BY_INFO: 일치하는 사용자 없음', error);
      return { success: false, data: null, error: '일치하는 사용자 정보가 없습니다.' };
    }

    // Mask Login ID for security (e.g., testuser -> te******)
    const loginId = data.login_id;
    const maskedId = loginId.length > 2 
      ? loginId.substring(0, 2) + '*'.repeat(loginId.length - 2)
      : loginId[0] + '*';

    nvLog('AT', '✅ QA_FIND_USER_BY_INFO 성공', { id: data.id });
    return { 
      success: true, 
      data: {
        id: data.id,
        loginId: data.login_id,
        maskedId: maskedId
      }
    };
  } catch (err: any) {
    nvLog('AT', '❌ QA_FIND_USER_BY_INFO 시스템 에러', err);
    return { success: false, data: null, error: '사용자 조회 중 오류가 발생했습니다: ' + err.message };
  }
}
