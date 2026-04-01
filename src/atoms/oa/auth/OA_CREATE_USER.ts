import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

interface CreateUserParams {
  login_id: string;
  password: string;
  email?: string;
  name: string;
  nickname: string;
  role: 'GENERAL' | 'EMPLOYER' | 'ADMIN' | 'SUPER_ADMIN';
  birth_date: string;
  gender: string;
  phone_number: string;
  nationality: string;
  is_age_verified: boolean;
  business_name?: string;
  representative_name?: string;
  business_number?: string;
  business_category?: string;
  opening_date?: string;
  sms_consent: boolean;
}

/**
 * OA_CREATE_USER: 신규 사용자를 데이터베이스에 저장합니다.
 */
export async function OA_CREATE_USER(input: CreateUserParams): Promise<{ success: boolean; userId: string | null; error: string | null }> {
  nvLog('AT', '▶️ OA_CREATE_USER 시작', { loginId: input.login_id, role: input.role });
  
  try {
    // 나이 계산 (만 나이 기준)
    const birthYear = parseInt(input.birth_date.substring(0, 4));
    const birthMonth = parseInt(input.birth_date.substring(4, 6));
    const birthDay = parseInt(input.birth_date.substring(6, 8));
    
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const m = today.getMonth() + 1 - birthMonth;
    if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
        age--;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          login_id: input.login_id,
          password: input.password,
          email: input.email || null,
          name: input.name,
          nickname: input.nickname,
          role: input.role,
          birth_date: input.birth_date,
          age: age,
          gender: input.gender,
          phone_number: input.phone_number,
          nationality: input.nationality,
          is_age_verified: input.is_age_verified,
          business_name: input.business_name || null,
          representative_name: input.representative_name || null,
          business_number: input.business_number || null,
          business_category: input.business_category || null,
          opening_date: input.opening_date || null,
          created_at: new Date().toISOString(),
        }
      ])
      .select('id')
      .single();

    if (error) throw error;
    
    return { success: true, userId: data.id, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ OA_CREATE_USER 에러', err.message);
    return { success: false, userId: null, error: err.message };
  }
}
