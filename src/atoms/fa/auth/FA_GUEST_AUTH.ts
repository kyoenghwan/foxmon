import { RA_PARSE_EXTERNAL_AUTH_DATA } from '@/src/atoms/ra/auth/RA_PARSE_EXTERNAL_AUTH_DATA';
import { OA_CREATE_GUEST_SESSION } from '@/src/atoms/oa/auth/OA_CREATE_GUEST_SESSION';
import { nvLog } from '../../../../lib/logger';

interface GuestAuthInput {
  authMethod: 'PHONE' | 'MOBILE' | 'IPIN' | 'FOREIGNER';
  userRawData: any; // Raw data from mock frontend
}

/**
 * FA_GUEST_AUTH: 비회원 인증 메인 워크플로우
 * 1. 외부 모듈 응답 파싱 및 권한(만 19세 이상) 검증
 * 2. 게스트 세션 쿠키 발급
 */
export async function FA_GUEST_AUTH(input: GuestAuthInput): Promise<{ success: boolean; message: string }> {
  nvLog('AT', '▶️ FA_GUEST_AUTH 시작', { method: input.authMethod });

  try {
    // Step 1: Parse and Validate External Module Data
    const parseResult = await RA_PARSE_EXTERNAL_AUTH_DATA(input.authMethod, input.userRawData);
    
    if (!parseResult.success || !parseResult.data) {
      nvLog('AT', '❌ FA_GUEST_AUTH 실패: 정책 반려', parseResult.error);
      return { success: false, message: parseResult.error || '인증 데이터가 유효하지 않습니다.' };
    }

    // Step 2: Create Secure HTTP-Only Guest Session Cookie
    const sessionResult = await OA_CREATE_GUEST_SESSION(parseResult.data);

    if (!sessionResult.success) {
      nvLog('AT', '❌ FA_GUEST_AUTH 실패: 세션 생성 오류');
      return { success: false, message: sessionResult.error || '세션 생성 중 오류가 발생했습니다.' };
    }

    nvLog('AT', '✅ FA_GUEST_AUTH 완료');
    return { success: true, message: '인증이 성공적으로 완료되었습니다.' };

  } catch (err: any) {
    nvLog('AT', '❌ FA_GUEST_AUTH 시스템 에러', err.message);
    return { success: false, message: '시스템 내부 오류가 발생했습니다.' };
  }
}
