import { RA_PARSE_EXTERNAL_AUTH_DATA } from '@/src/atoms/ra/auth/RA_PARSE_EXTERNAL_AUTH_DATA';
import { OA_CREATE_GUEST_SESSION } from '@/src/atoms/oa/auth/OA_CREATE_GUEST_SESSION';
import { QA_PORTONE_GET_CERTIFICATION } from '@/src/atoms/qa/auth/QA_PORTONE_GET_CERTIFICATION';
import { nvLog } from '../../../../lib/logger';

interface GuestAuthInput {
  authMethod: 'PHONE' | 'MOBILE' | 'IPIN' | 'FOREIGNER';
  userRawData: {
    imp_uid?: string;
    name?: string;
    birthDate?: string;
    gender?: string;
    phoneNumber?: string;
    nationality?: 'KOREAN' | 'FOREIGNER';
  };
}

/**
 * FA_GUEST_AUTH: 비회원 인증 메인 워크플로우
 * 1. imp_uid가 제공되는 경우 포트원 API 연동 검증 수행
 * 2. 외부 모듈 응답 파싱 및 권한(만 19세 이상) 검증
 * 3. 게스트 세션 쿠키 발급
 */
export async function FA_GUEST_AUTH(input: GuestAuthInput): Promise<{ success: boolean; message: string; data?: any }> {
  nvLog('AT', '▶️ FA_GUEST_AUTH 시작', { method: input.authMethod, hasImpUid: !!input.userRawData?.imp_uid });

  try {
    let verifiedRawData = input.userRawData;

    // Step 1: Real certification verification with PortOne API if imp_uid is provided
    if (input.userRawData?.imp_uid) {
      nvLog('AT', '🔍 포트원 실서버 검증 시작', { imp_uid: input.userRawData.imp_uid });
      const certResult = await QA_PORTONE_GET_CERTIFICATION({ imp_uid: input.userRawData.imp_uid });
      
      if (!certResult.success || !certResult.data) {
        nvLog('AT', '❌ FA_GUEST_AUTH 실패: 포트원 API 본인인증 정보 조회 실패', certResult.message);
        return { success: false, message: certResult.message || '본인인증 상세 정보를 가져올 수 없습니다.' };
      }

      verifiedRawData = {
        name: certResult.data.name,
        birthDate: certResult.data.birthDate,
        gender: certResult.data.gender,
        phoneNumber: certResult.data.phoneNumber,
        nationality: certResult.data.nationality
      };
      nvLog('AT', '✅ 포트원 API 데이터 조회 및 검증 완료', { name: verifiedRawData.name });
    } else {
      nvLog('AT', '⚠️ imp_uid 누락. 로컬 Mock 본인인증 데이터를 검증합니다.');
    }

    // Step 2: Parse and Validate External/PortOne Data
    const parseResult = await RA_PARSE_EXTERNAL_AUTH_DATA(input.authMethod, verifiedRawData as any);
    
    if (!parseResult.success || !parseResult.data) {
      nvLog('AT', '❌ FA_GUEST_AUTH 실패: 정책 반려', parseResult.error);
      return { success: false, message: parseResult.error || '인증 데이터가 유효하지 않습니다.' };
    }

    // Step 3: Create Secure HTTP-Only Guest Session Cookie
    const sessionResult = await OA_CREATE_GUEST_SESSION(parseResult.data);

    if (!sessionResult.success) {
      nvLog('AT', '❌ FA_GUEST_AUTH 실패: 세션 생성 오류');
      return { success: false, message: sessionResult.error || '세션 생성 중 오류가 발생했습니다.' };
    }

    nvLog('AT', '✅ FA_GUEST_AUTH 완료');
    return { success: true, message: '인증이 성공적으로 완료되었습니다.', data: verifiedRawData };

  } catch (err: any) {
    nvLog('AT', '❌ FA_GUEST_AUTH 시스템 에러', err.message);
    return { success: false, message: '시스템 내부 오류가 발생했습니다.' };
  }
}
