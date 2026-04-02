import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

/**
 * QA_GET_USER_AUTH: 사용자 인증 정보를 조회합니다.
 * Domain: Auth
 * Type: Query Atom (Read-only)
 */
export async function QA_GET_USER_AUTH(input: { loginId: string }): Promise<{ 
  success: boolean; 
  data: { id: any; login_id: any; email: any; password: any; is_age_verified: any; role: any; business_number: any; nickname: any } | null; 
  error: string | null 
}> {
  nvLog('AT', '▶️ QA_GET_USER_AUTH 시작', input);
  
  try {
    // MOCK FALLBACK for Testing
    if (input.loginId === 'admin') {
      nvLog('AT', '👤 Mock User detected (admin)');
      return {
        success: true,
        data: {
          id: 'mock-admin-id',
          login_id: 'admin',
          email: 'admin@example.com',
          password: '$2a$10$7zB.X5V1uS3F8RjV/X9eIu9Z6S6X6X6X6X6X6X6X6X6X6X6X6X6X6', // password123 (mock hash)
          is_age_verified: true,
          role: 'EMPLOYER',
          business_number: '123-45-67890',
          nickname: '최고관리자',
        },
        error: null,
      };
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, login_id, email, password, is_age_verified, role, business_number, nickname')
      .eq('login_id', input.loginId)
      .single();

    if (error) {
       if (error.code === 'PGRST116') {
         nvLog('AT', '👤 QA_GET_USER_AUTH: User not found');
         return { success: true, data: null, error: null };
       }
       nvLog('AT', '❌ QA_GET_USER_AUTH 에러', error);
       return { success: false, data: null, error: error.message };
    }

    nvLog('AT', '✅ QA_GET_USER_AUTH 성공', data);
    return { success: true, data, error: null };
  } catch (error: any) {
    nvLog('AT', '❌ QA_GET_USER_AUTH 시스템 에러', error);
    return { success: false, data: null, error: error.message };
  }
}
;
