import { cookies } from 'next/headers';
import { nvLog } from '../../../../lib/logger';

export async function OA_CREATE_GUEST_SESSION(parsedData: any) {
  nvLog('AT', '▶️ OA_CREATE_GUEST_SESSION 시작', { name: parsedData.name });

  try {
    const cookieStore = cookies();
    
    // In a real app, this should be a signed JWT containing { id, name, birthDate, isGuest: true }
    // For MVP, we serialize it as a base64 or JSON string and set HTTP-only cookie.
    
    const sessionData = {
      isGuest: true,
      name: parsedData.name,
      birthDate: parsedData.birthDate,
      verifiedMethod: parsedData.verifiedMethod,
      timestamp: Date.now()
    };

    const sessionString = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    (await cookieStore).set('foxmon_guest_session', sessionString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    // Also set the age_verified flag loosely for frontend Middleware usage
    (await cookieStore).set('age_verified', 'true', {
      httpOnly: false, // Accessible to JS if needed, but best restricted
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24
    });

    nvLog('AT', '✅ OA_CREATE_GUEST_SESSION 성공: 쿠키 발급 완료');
    return { success: true, token: sessionString };
  } catch (error: any) {
    nvLog('AT', '❌ OA_CREATE_GUEST_SESSION 시스템 에러', error.message);
    return { success: false, error: '세션 생성에 실패했습니다.' };
  }
}
