import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';

export interface UpdateUserProfileInput {
  userId: string;
  nickname?: string;
  email?: string;
  phoneNumber?: string;
  profile_image_url?: string;
  sns_kakao?: string;
  sns_instagram?: string;
  sns_telegram?: string;
  sns_x?: string;
}

export async function OA_UPDATE_USER_PROFILE(input: UpdateUserProfileInput) {
  nvLog('AT', '▶️ OA_UPDATE_USER_PROFILE 시작', { userId: input.userId });

  try {
    const updates: any = {};

    if (input.nickname !== undefined) updates.nickname = input.nickname;
    if (input.email !== undefined) updates.email = input.email;
    if (input.phoneNumber !== undefined) updates.phone_number = input.phoneNumber;
    if (input.profile_image_url !== undefined) updates.profile_image_url = input.profile_image_url;
    if (input.sns_kakao !== undefined) updates.sns_kakao = input.sns_kakao;
    if (input.sns_instagram !== undefined) updates.sns_instagram = input.sns_instagram;
    if (input.sns_telegram !== undefined) updates.sns_telegram = input.sns_telegram;
    if (input.sns_x !== undefined) updates.sns_x = input.sns_x;

    // 업데이트할 내용이 없는 경우
    if (Object.keys(updates).length === 0) { 
       return { success: true, data: null, error: null };
    }

    // 서버 사이드 전용 어드민 클라이언트(supabaseAdmin)를 사용하여 RLS(Row Level Security) 차단 우회
    // ⚠️ .single() 사용 금지: RLS가 UPDATE를 차단하면 0행 반환 → "Cannot coerce" 에러 발생
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', input.userId)
      .select('id, nickname, phone_number');

    if (error) {
      nvLog('AT', '❌ OA_UPDATE_USER_PROFILE 에러', error.message);
      return { success: false, data: null, error: error.message };
    }

    // RLS 차단 감지: 에러 없이 0행 반환 = 보안 정책이 UPDATE를 차단한 것
    if (!data || (Array.isArray(data) && data.length === 0)) {
      nvLog('AT', '⚠️ OA_UPDATE_USER_PROFILE: RLS 차단 또는 사용자 미존재', { userId: input.userId });
      return { success: false, data: null, error: '프로필 업데이트 권한이 없습니다. 관리자에게 문의하세요.' };
    }

    nvLog('AT', '✅ OA_UPDATE_USER_PROFILE 완료', data);
    return { success: true, data, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ OA_UPDATE_USER_PROFILE 시스템 에러', err.message);
    return { success: false, data: null, error: err.message };
  }
}
