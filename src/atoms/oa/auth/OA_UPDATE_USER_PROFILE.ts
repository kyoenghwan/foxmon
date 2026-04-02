import { supabase } from '@/lib/supabase';
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

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', input.userId)
      .select('id, nickname, phone_number')
      .single();

    if (error) {
      nvLog('AT', '❌ OA_UPDATE_USER_PROFILE 에러', error.message);
      return { success: false, data: null, error: error.message };
    }

    nvLog('AT', '✅ OA_UPDATE_USER_PROFILE 완료', data);
    return { success: true, data, error: null };
  } catch (err: any) {
    nvLog('AT', '❌ OA_UPDATE_USER_PROFILE 시스템 에러', err.message);
    return { success: false, data: null, error: err.message };
  }
}
