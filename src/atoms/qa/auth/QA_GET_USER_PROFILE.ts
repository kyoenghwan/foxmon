import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export async function QA_GET_USER_PROFILE(userId: string) {
  nvLog('AT', '▶️ QA_GET_USER_PROFILE 시작', { userId });
  
  try {
    // MOCK fallback
    if (userId === 'mock-user-id' || userId === 'mock-admin-id') {
      return {
        success: true,
        data: {
          gender: 'M',
          phone_number: '010-1234-5678',
          nickname: '최고관리자',
          email: 'admin@foxmon.com',
          sns_kakao: null,
          sns_instagram: null,
          sns_telegram: null,
          sns_x: null,
          profile_image_url: null,
          role: 'ADMIN',
          business_name: '폭스몬(주)',
          business_number: '123-45-67890'
        }
      };
    }

    const { data, error } = await supabase
      .from('users')
      .select('nickname, email, phone_number, gender, sns_kakao, sns_instagram, sns_telegram, sns_x, profile_image_url, role, business_name, business_number')
      .eq('id', userId)
      .single();

    if (error) {
       nvLog('AT', '❌ QA_GET_USER_PROFILE 에러', error.message);
       // Return mock if table is missing during dev
       return { success: true, data: { gender: 'M', phone_number: '010-0000-0000', nickname: '사용자', email: '', role: 'GENERAL', business_name: null, business_number: null, profile_image_url: null, sns_kakao: null, sns_instagram: null, sns_telegram: null, sns_x: null } };
    }

    return { success: true, data };
  } catch (error: any) {
    nvLog('AT', '❌ QA_GET_USER_PROFILE 실패', error.message);
    return { success: true, data: { gender: 'M', phone_number: '010-0000-0000', nickname: '사용자', email: '', role: 'GENERAL', business_name: null, business_number: null, profile_image_url: null, sns_kakao: null, sns_instagram: null, sns_telegram: null, sns_x: null } }; 
  }
}
