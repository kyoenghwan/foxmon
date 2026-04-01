import { nvLog } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { RA_HASH_PASSWORD } from '../../ra/auth/RA_HASH_PASSWORD';

interface ResetPasswordInput {
  userId: string;
  newPassword: string;
}

export async function OA_RESET_USER_PASSWORD({ userId, newPassword }: ResetPasswordInput) {
  nvLog('AT', '▶️ OA_RESET_USER_PASSWORD 시작', { userId });

  try {
    // 1. Hash the new password
    const { data: hashedPassword } = await RA_HASH_PASSWORD(newPassword);

    // 2. Update DB
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (error) {
      nvLog('AT', '❌ OA_RESET_USER_PASSWORD DB 에러', error);
      return { success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' };
    }

    nvLog('AT', '✅ OA_RESET_USER_PASSWORD 성공');
    return { success: true };
  } catch (err) {
    nvLog('AT', '❌ OA_RESET_USER_PASSWORD 시스템 에러', err);
    return { success: false, message: '시스템 오류로 비밀번호 변경에 실패했습니다.' };
  }
}
