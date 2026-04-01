import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export interface ChangePasswordInput {
  userId: string;
  hashedPassword?: string;
}

export async function OA_CHANGE_PASSWORD(input: ChangePasswordInput) {
  nvLog('AT', '▶️ OA_CHANGE_PASSWORD 시작', { userId: input.userId });

  if (!input.hashedPassword) {
    return { success: false, error: '유효하지 않은 패스워드 입력입니다.' };
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ password: input.hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', input.userId);

    if (error) {
      nvLog('AT', '❌ OA_CHANGE_PASSWORD 에러', error.message);
      return { success: false, error: error.message };
    }

    nvLog('AT', '✅ OA_CHANGE_PASSWORD 완료');
    return { success: true, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ OA_CHANGE_PASSWORD 시스템 에러', err.message);
    return { success: false, error: err.message };
  }
}
