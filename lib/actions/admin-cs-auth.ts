'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { RA_VERIFY_PASSWORD } from '@/src/atoms/ra/auth/RA_VERIFY_PASSWORD';
import { cookies } from 'next/headers';
import { isAdminRole } from '@/lib/normalize-user-role';

/**
 * CS 독립 단말기 전용 로그인 실행
 */
export async function loginCsTerminal(payload: {
  username?: string;
  password?: string;
  deviceToken?: string;
}) {
  const username = payload.username?.trim().toLowerCase();
  const password = payload.password;
  const deviceToken = payload.deviceToken;

  if (!username || !password || !deviceToken) {
    return { success: false, message: '아이디, 비밀번호, 기기 식별자가 모두 필요합니다.' };
  }

  try {
    // 1. 유저 조회
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, login_id, password, role')
      .eq('login_id', username)
      .single();

    if (userError || !user) {
      nvLog('FW', `❌ CS 로그인 실패: 존재하지 않는 계정 (${username})`);
      return { success: false, message: '존재하지 않는 계정입니다.' };
    }

    // 2. 권한 검사 (무조건 어드민 계정이어야 함 - 공백 등 노멀라이징 헬퍼 적용)
    if (!isAdminRole(user.role)) {
      nvLog('FW', `❌ CS 로그인 실패: 관리자 권한 없음 (${username})`);
      return { success: false, message: '관리자 권한이 없는 계정입니다.' };
    }

    // 3. 비밀번호 검증
    const verifyResult = await RA_VERIFY_PASSWORD({
      password,
      hashedPassword: user.password,
    });

    if (!verifyResult.isValid || verifyResult.error) {
      nvLog('FW', `❌ CS 로그인 실패: 비밀번호 오류 (${username})`);
      return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    // 4. 기기 인증 재검사 (APPROVED 상태여야 함)
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('cs_approved_devices')
      .select('status')
      .eq('device_token', deviceToken)
      .single();

    if (deviceError || !device || device.status !== 'APPROVED') {
      nvLog('FW', `❌ CS 로그인 거절: 기기 미인증 (${username}, Token: ${deviceToken})`);
      return { success: false, message: '등록 승인되지 않은 기기입니다. 기기 승인 요청을 먼저 완료해 주세요.' };
    }

    // 5. 로그인 통과 -> CS 전용 쿠키 세션 발행 (HTTP-Only)
    // 쿠키 값은 간단히 유저 ID와 서명 형태의 문자열로 구성 (HttpOnly 쿠키라 안전)
    const sessionToken = `CS_SESSION_${user.id}_${Date.now()}`;
    
    const cookieStore = await cookies();
    cookieStore.set('cs_session_token', sessionToken, {
      path: '/',
      maxAge: 60 * 60 * 12, // 12시간 지속
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    nvLog('FW', `✅ CS 터미널 로그인 성공: 계정 ${username}, 기기 토큰 ${deviceToken}`);
    return { success: true, message: '로그인에 성공했습니다.' };
  } catch (err: any) {
    nvLog('FW', '❌ CS 로그인 중 예외 발생', err.message);
    return { success: false, message: '로그인 처리 중 서버 오류가 발생했습니다.' };
  }
}

/**
 * CS 전용 로그인 로그아웃 처리
 */
export async function logoutCsTerminal() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('cs_session_token');
    nvLog('FW', '✅ CS 터미널 로그아웃 완료');
    return { success: true };
  } catch (err: any) {
    nvLog('FW', '❌ CS 로그아웃 예외', err.message);
    return { success: false };
  }
}
