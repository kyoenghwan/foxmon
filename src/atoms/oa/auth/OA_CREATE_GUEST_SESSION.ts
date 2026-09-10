import { cookies } from 'next/headers';
import { createGuestToken } from '@/lib/guest-session';
import { RA_PARSE_EXTERNAL_AUTH_DATA } from '@/src/atoms/ra/auth/RA_PARSE_EXTERNAL_AUTH_DATA';
import { nvLog } from '../../../../lib/logger';

export async function OA_CREATE_GUEST_SESSION(parsedData: any) {
  nvLog('AT', '▶️ OA_CREATE_GUEST_SESSION 시작');

  try {
    const cookieStore = cookies();
    
    const checked = await RA_PARSE_EXTERNAL_AUTH_DATA(parsedData.verifiedMethod, parsedData);
    if (!checked.success) return { success: false, error: checked.error };
    const sessionString = await createGuestToken({
      name: parsedData.name,
      birthDate: parsedData.birthDate,
      phoneNumber: parsedData.phoneNumber,
      gender: parsedData.gender,
      nationality: parsedData.nationality,
      ci: parsedData.ci,
      verifiedMethod: parsedData.verifiedMethod,
    });

    (await cookieStore).set('foxmon_guest_session', sessionString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // maxAge 없음 = 세션 쿠키: 브라우저를 닫으면 자동 소멸 (PC방 보안)
    });

    // Also set the age_verified flag loosely for frontend Middleware usage
    (await cookieStore).set('age_verified', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // maxAge 없음 = 세션 쿠키: 브라우저를 닫으면 자동 소멸 (PC방 보안)
    });

    nvLog('AT', '✅ OA_CREATE_GUEST_SESSION 성공: 쿠키 발급 완료');
    return { success: true };
  } catch (error: any) {
    nvLog('AT', '❌ OA_CREATE_GUEST_SESSION 시스템 에러', error.message);
    return { success: false, error: '세션 생성에 실패했습니다.' };
  }
}
