import { normalizeLoginIdForAuth } from '@/src/atoms/ra/auth/RA_LOGIN_ID';
import { normalizeDbEnum } from '@/lib/normalize-user-role';
import { RA_VALIDATE_LOGIN } from '@/src/atoms/ra/auth/RA_VALIDATE_LOGIN';
import { QA_GET_USER_AUTH } from '@/src/atoms/qa/auth/QA_GET_USER_AUTH';
import { RA_VERIFY_PASSWORD } from '@/src/atoms/ra/auth/RA_VERIFY_PASSWORD';
import { OA_INSERT_CONNECTION_LOG } from '@/src/atoms/oa/auth/OA_INSERT_CONNECTION_LOG';
import { nvLog } from '../../../../lib/logger';

/**
 * FA_LOGIN_FLOW: 로그인 로직을 관장하는 핵심 Flow Atom
 * 기반 명세: atoms/auth/flow-atoms/FA_LOGIN_FLOW.yaml
 */
export const FA_LOGIN_FLOW = async (input: { 
  loginId?: string; 
  password?: string; 
  authContext?: any;
  ipAddress?: string;
  userAgent?: string;
}) => {
  // Context Mapping의 핵심: 모든 입출력은 context 객체 내부에서만 순환합니다.
  const normalizedLoginId = normalizeLoginIdForAuth(input?.loginId ?? '');
  const context: any = { input: { ...input, loginId: normalizedLoginId } };
  nvLog('AT', '▶️ FA_LOGIN_FLOW 시작', { loginId: context.input.loginId, ipAddress: context.input.ipAddress });

  try {
    // Step 1: 입력값 검증 (RA 호출)
    context.validationResult = RA_VALIDATE_LOGIN({
      loginId: context.input.loginId,
      password: context.input.password,
    });
    
    if (!context.validationResult.isValid) {
      nvLog('AT', '⚠️ FA_LOGIN_FLOW 검증 실패', context.validationResult.error);
      return { success: false, message: context.validationResult.error };
    }

    // Step 2: 사용자 정보 조회 (QA 호출)
    context.authResult = await QA_GET_USER_AUTH({ 
      loginId: context.input.loginId 
    });
    
    // QA 에러 핸들링 1: 시스템 오류(DB 접속 실패 등)
    if (!context.authResult.success) {
      throw new Error(context.authResult.error);
    }
    
    // QA 에러 핸들링 2: Not Found (정상 처리되었으나 데이터 없음)
    if (!context.authResult.data) {
      nvLog('AT', '⚠️ FA_LOGIN_FLOW 존재하지 않는 사용자 ID');
      return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    }

    // Step 3: 비밀번호 검증 (RA 호출)
    context.passwordResult = await RA_VERIFY_PASSWORD({
      password: context.input.password,
      hashedPassword: context.authResult.data.password,
    });

    if (!context.passwordResult.isValid) {
      nvLog('AT', '⚠️ FA_LOGIN_FLOW 비밀번호 불일치');
      return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
    }

    nvLog('AT', '✅ FA_LOGIN_FLOW 로직 처리 완료 (데이터 포맷팅)');
    
    const userId = context.authResult.data.id;

    // Step 4: 접속 로그 기록 (OA 호출, 비동기 실행 및 에러 무시 처리로 가벼움 보장)
    if (context.input.ipAddress) {
      await OA_INSERT_CONNECTION_LOG({
        userId,
        ipAddress: context.input.ipAddress,
        userAgent: context.input.userAgent
      });
    }

    // 최종 결과 반환 (UI에서 사용될 형태)
    return {
      success: true,
      data: {
        userId,
        loginId: context.authResult.data.login_id,
        email: context.authResult.data.email,
        is_age_verified: context.authResult.data.is_age_verified,
        role: normalizeDbEnum(context.authResult.data.role),
        staff_team: normalizeDbEnum(context.authResult.data.staff_team) || undefined,
        business_number: context.authResult.data.business_number,
        nickname: context.authResult.data.nickname,
      },
      message: '로그인 성공',
    };
  } catch (error: any) {
    nvLog('AT', '❌ FA_LOGIN_FLOW 처리 중 시스템 에러 발생', error);
    return { success: false, message: '시스템 오류가 발생했습니다. 잠시 후 시도해주세요.' };
  }
};
