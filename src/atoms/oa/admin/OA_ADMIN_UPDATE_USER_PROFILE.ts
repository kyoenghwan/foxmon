'use server';

import { createClient } from '@/utils/supabase/server';
import { nvLog } from '@/lib/logger';
import { auth } from '@/auth';
import { isAdminRole } from '@/lib/normalize-user-role';

interface UpdateUserParams {
  targetUserId: string;
  name: string;
  nickname: string;
  phone_number: string;
  role: 'GENERAL' | 'EMPLOYER' | 'ADMIN' | 'SUPER_ADMIN' | 'VIEWER';
  merchant_tier: 'NORMAL' | 'VIP' | 'VVIP' | 'VVVIP';
}

/**
 * [OA] OA_ADMIN_UPDATE_USER_PROFILE
 * 관리자 권한을 이용하여 특정 회원의 프로필 정보, 권한(role) 및 업체 등급(merchant_tier)을 수정합니다.
 */
export const OA_ADMIN_UPDATE_USER_PROFILE = async (params: UpdateUserParams) => {
  try {
    const session = await auth();
    const currentUser = session?.user;

    // 1. 요청자가 실제 어드민인지 보안 검증
    if (!currentUser || !isAdminRole(currentUser.role || '')) {
      return { success: false, message: '권한이 없습니다. 관리자만 이용할 수 있습니다.' };
    }

    const { targetUserId, name, nickname, phone_number, role, merchant_tier } = params;

    if (!targetUserId) {
      return { success: false, message: '수정할 회원을 식별할 수 없습니다.' };
    }

    const supabase = await createClient();

    // 2. DB 업데이트 실행
    const { data, error } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        nickname: nickname.trim(),
        phone_number: phone_number.trim(),
        role,
        merchant_tier
      })
      .eq('id', targetUserId)
      .select();

    if (error) {
      nvLog('AT', `❌ OA_ADMIN_UPDATE_USER_PROFILE DB 에러`, error);
      return { success: false, message: `수정 실패: ${error.message}` };
    }

    nvLog('AT', `▶️ OA_ADMIN_UPDATE_USER_PROFILE 수정 완료`, {
      updatedBy: currentUser.id,
      targetUserId,
      updates: params
    });

    return { success: true, message: '회원 정보가 성공적으로 수정되었습니다.', data };
  } catch (e: any) {
    console.error('OA_ADMIN_UPDATE_USER_PROFILE caught error:', e);
    return { success: false, message: e.message || '오류가 발생했습니다.' };
  }
};
