import { RA_HASH_PASSWORD } from '@/src/atoms/ra/auth/RA_HASH_PASSWORD';
import { QA_CHECK_ID_NICKNAME_EXISTS } from '@/src/atoms/qa/auth/QA_CHECK_ID_NICKNAME_EXISTS';
import { OA_CREATE_USER } from '@/src/atoms/oa/auth/OA_CREATE_USER';
import { nvLog } from '../../../../lib/logger';

interface RegisterInput {
  loginId: string;
  password: string;
  email?: string;
  name: string;
  nickname: string;
  role: 'GENERAL' | 'EMPLOYER' | 'ADMIN' | 'SUPER_ADMIN';
  birthDate: string;
  gender: string;
  phoneNumber: string;
  nationality: string;
  is_age_verified: boolean;
  business_name?: string;
  representative_name?: string;
  business_number?: string;
  business_category?: string;
  opening_date?: string;
  smsConsent: boolean;
}

/**
 * FA_REGISTER_FLOW: 사용자 회원가입 전체 프로세스 (v2.0)
 */
export async function FA_REGISTER_FLOW(input: RegisterInput): Promise<{ success: boolean; message: string }> {
  nvLog('AT', '▶️ FA_REGISTER_FLOW 시작', { loginId: input.loginId, role: input.role });

  try {
    // 1. 아이디 및 닉네임 중복 확인
    const duplicateCheck = await QA_CHECK_ID_NICKNAME_EXISTS({
      loginId: input.loginId,
      nickname: input.nickname
    });

    if (duplicateCheck.idExists) {
      return { success: false, message: '이미 사용 중인 아이디입니다.' };
    }
    if (duplicateCheck.nicknameExists) {
      return { success: false, message: '이미 사용 중인 닉네임입니다.' };
    }

    // 2. 비밀번호 해싱
    const hashResult = await RA_HASH_PASSWORD(input.password);

    // 3. 사용자 생성 (DB 필드명에 맞춰 키 매핑)
    const createResult = await OA_CREATE_USER({
      login_id: input.loginId,
      password: hashResult.data,
      email: input.email,
      name: input.name,
      nickname: input.nickname,
      role: input.role,
      birth_date: input.birthDate,
      gender: input.gender,
      phone_number: input.phoneNumber,
      nationality: input.nationality,
      is_age_verified: input.is_age_verified,
      business_name: input.business_name,
      representative_name: input.representative_name,
      business_number: input.business_number,
      business_category: input.business_category,
      opening_date: input.opening_date,
      sms_consent: input.smsConsent,
    });

    if (!createResult.success) {
      return { success: false, message: createResult.error || '회원가입 중 오류가 발생했습니다.' };
    }

    nvLog('AT', '✅ FA_REGISTER_FLOW 완료');
    return { success: true, message: '회원가입이 완료되었습니다.' };
  } catch (err: any) {
    nvLog('AT', '❌ FA_REGISTER_FLOW 시스템 에러', err.message);
    return { success: false, message: '시스템 오류가 발생했습니다.' };
  }
}
