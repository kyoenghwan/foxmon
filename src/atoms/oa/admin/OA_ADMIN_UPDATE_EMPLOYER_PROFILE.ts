'use server';

import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';
import { auth } from '@/auth';
import { isAdminRole } from '@/lib/normalize-user-role';

interface UpdateEmployerParams {
  targetUserId: string;
  verified_business_name: string;
  verified_ceo_name: string;
  business_registration_number: string;
  email: string;
  nickname: string;
  merchant_tier: 'NORMAL' | 'VIP' | 'VVIP' | 'VVVIP';
}

/**
 * [OA] OA_ADMIN_UPDATE_EMPLOYER_PROFILE
 * 관리자 권한을 이용하여 업체의 상세 정보(상호명, 대표자명, 사업자 번호, 이메일, 닉네임, 등급)를 수정합니다.
 */
export const OA_ADMIN_UPDATE_EMPLOYER_PROFILE = async (params: UpdateEmployerParams) => {
  try {
    const session = await auth();
    const currentUser = session?.user;

    // 1. 요청자가 실제 어드민인지 보안 검증
    if (!currentUser || !isAdminRole(currentUser.role || '')) {
      return { success: false, message: '권한이 없습니다. 관리자만 이용할 수 있습니다.' };
    }

    const { 
      targetUserId, 
      verified_business_name, 
      verified_ceo_name, 
      business_registration_number, 
      email, 
      nickname, 
      merchant_tier 
    } = params;

    if (!targetUserId) {
      return { success: false, message: '수정할 회원을 식별할 수 없습니다.' };
    }

    const supabase = await createClient();

    // 2. DB 업데이트 실행
    const { data, error } = await supabase
      .from('users')
      .update({
        verified_business_name: verified_business_name.trim(),
        verified_ceo_name: verified_ceo_name.trim(),
        business_registration_number: business_registration_number.trim(),
        email: email.trim(),
        nickname: nickname.trim(),
        merchant_tier
      })
      .eq('id', targetUserId)
      .select();

    if (error) {
      nvLog('AT', `❌ OA_ADMIN_UPDATE_EMPLOYER_PROFILE DB 에러`, error);
      return { success: false, message: `수정 실패: ${error.message}` };
    }

    nvLog('AT', `▶️ OA_ADMIN_UPDATE_EMPLOYER_PROFILE 수정 완료`, {
      updatedBy: currentUser.id,
      targetUserId,
      updates: params
    });

    return { success: true, message: '업체 정보가 성공적으로 수정되었습니다.', data };
  } catch (e: any) {
    console.error('OA_ADMIN_UPDATE_EMPLOYER_PROFILE caught error:', e);
    return { success: false, message: e.message || '오류가 발생했습니다.' };
  }
};
