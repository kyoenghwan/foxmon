import { NextResponse } from 'next/server';
import { nvLog } from '@/lib/logger';
import { 
  getKmcToken, 
  requestKmcAuth, 
  confirmKmcAuth, 
  isMockMode, 
  KmcUserInfo 
} from '@/lib/kmc-service';
import { OA_CREATE_GUEST_SESSION } from '@/src/atoms/oa/auth/OA_CREATE_GUEST_SESSION';
import { RA_PARSE_EXTERNAL_AUTH_DATA } from '@/src/atoms/ra/auth/RA_PARSE_EXTERNAL_AUTH_DATA';

export async function POST(req: Request) {
  const trace: string[] = [];
  try {
    const body = await req.json();
    const { action, ...params } = body;

    nvLog('FW', `▶️ KMC API 요청 수신 - action: ${action}`);

    const isTestMode = process.env.NEXT_PUBLIC_KMC_TEST_MODE === 'true';
    const isMock = isTestMode && ((await isMockMode()) || params.isMock === true);

    if (isMock) {
      nvLog('FW', '⚠️ Mock 모드로 요청을 시뮬레이션합니다.');
      return handleMockAction(action, params);
    }

    // 실제 KMC 서버 연동 흐름
    switch (action) {
      case 'token': {
        let { siteUrl } = params;
        trace.push(`📡 [API_ROUTE] 프론트엔드 전달 siteUrl: [${params.siteUrl || '없음'}]`);
        if (process.env.NEXT_PUBLIC_KMC_TEST_MODE !== 'true') {
          const envSiteUrl = process.env.KMC_SITE_URL;
          trace.push(`📡 [API_ROUTE] 환경변수 KMC_SITE_URL 로드: [${envSiteUrl || '미지정'}]`);
          siteUrl = envSiteUrl || 'https://foxmon.co.kr';
        }
        trace.push(`📡 [API_ROUTE] KMC로 송신할 최종 siteUrl 결정: [${siteUrl}]`);
        
        if (!siteUrl) {
          return NextResponse.json({ success: false, message: 'siteUrl 파라미터가 누락되었습니다.', trace }, { status: 400 });
        }
        
        try {
          const tokenData = await getKmcToken(siteUrl, trace);
          if (!tokenData) {
            return NextResponse.json({ success: false, message: 'KMC 토큰 발급 실패', trace }, { status: 500 });
          }
          return NextResponse.json({ success: true, data: tokenData, trace });
        } catch (err: any) {
          return NextResponse.json({ success: false, message: `KMC 토큰 요청 오류: ${err.message}`, trace }, { status: 500 });
        }
      }

      case 'request': {
        const { encryptMOKToken, publicKey, providerId, reqAuthType, userName, userPhone, userBirthday, userGender, userNation, siteUrl } = params;
        if (!encryptMOKToken || !publicKey || !providerId || !reqAuthType || !userName || !userPhone || !userBirthday || !userGender || !userNation || !siteUrl) {
          return NextResponse.json({ success: false, message: '필수 요청 파라미터가 누락되었습니다.' }, { status: 400 });
        }

        let finalSiteUrl = siteUrl;
        if (process.env.NEXT_PUBLIC_KMC_TEST_MODE !== 'true') {
          finalSiteUrl = process.env.KMC_SITE_URL || 'https://foxmon.co.kr';
        }

        const requestResult = await requestKmcAuth({
          encryptMOKToken,
          publicKey,
          providerId,
          reqAuthType,
          userName,
          userPhone,
          userBirthday,
          userGender,
          userNation,
          siteUrl: finalSiteUrl
        });

        return NextResponse.json(requestResult);
      }

      case 'confirm': {
        const { encryptMOKToken, publicKey, authNumber } = params;
        if (!encryptMOKToken || !publicKey || !authNumber) {
          return NextResponse.json({ success: false, message: '필수 검증 파라미터가 누락되었습니다.' }, { status: 400 });
        }

        const confirmResult = await confirmKmcAuth({
          encryptMOKToken,
          publicKey,
          authNumber
        });

        if (!confirmResult.success || !confirmResult.userInfo) {
          return NextResponse.json({ success: false, message: confirmResult.message }, { status: 400 });
        }

        // 만 19세 이상 나이 검증 추가 필터링 (RA 원자 호출)
        const parseResult = await RA_PARSE_EXTERNAL_AUTH_DATA('MOBILE', confirmResult.userInfo);
        if (!parseResult.success || !parseResult.data) {
          return NextResponse.json({ success: false, message: parseResult.error || '나이 검증에 실패했습니다.' }, { status: 400 });
        }

        // 게스트 세션 쿠키 생성 및 발급
        const sessionResult = await OA_CREATE_GUEST_SESSION(parseResult.data);
        if (!sessionResult.success) {
          return NextResponse.json({ success: false, message: '세션 발급 오류가 발생했습니다.' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: '성인 인증이 완료되었습니다.',
          data: confirmResult.userInfo
        });
      }

      default:
        return NextResponse.json({ success: false, message: '지원하지 않는 action입니다.' }, { status: 400 });
    }
  } catch (err: any) {
    nvLog('FW', '❌ KMC API 라우트 핸들러 에러', err.message);
    return NextResponse.json({ success: false, message: `서버 내부 에러: ${err.message}`, trace }, { status: 500 });
  }
}

/**
 * 키 파일이 없을 때 즉시 프론트 및 가입 테스트를 진행하기 위한 Mock 응답 시뮬레이션
 */
async function handleMockAction(action: string, params: any) {
  switch (action) {
    case 'token':
      return NextResponse.json({
        success: true,
        data: {
          encryptMOKToken: 'MOCK_TOKEN_' + Math.random().toString(36).substring(7),
          publicKey: 'MOCK_PUBLIC_KEY_BASE64_FORMAT_STR_FOR_AES_ENCRYPTION_DEMO'
        }
      });

    case 'request':
      nvLog('FW', `📱 [Mock SMS 발송] ${params.userName} (${params.userPhone}) ➔ 인증번호 123456 발송 시뮬레이션`);
      return NextResponse.json({
        success: true,
        message: '인증번호가 발송되었습니다. (Mock 모드: 123456 입력)',
        encryptMOKToken: params.encryptMOKToken
      });

    case 'confirm': {
      const { authNumber, mockUser } = params;
      
      // 기본적으로 123456 입력 시 성공 처리
      if (authNumber !== '123456') {
        return NextResponse.json({ success: false, message: '인증번호가 올바르지 않습니다. (Mock 번호: 123456)' }, { status: 400 });
      }

      // 테스트 목적상 생년월일이나 기타 정보를 커스텀하게 넘겨 테스트할 수 있게 지원
      const mockUserInfo: KmcUserInfo = {
        name: mockUser?.name || params.userName || '홍길동',
        birthDate: mockUser?.birthDate || params.userBirthday || '19900101',
        gender: mockUser?.gender || params.userGender || 'MALE',
        phoneNumber: mockUser?.phoneNumber || params.userPhone || '01012345678',
        nationality: mockUser?.nationality || params.userNation || 'KOREAN',
        isAdult: true,
        verifiedMethod: 'MOBILE'
      };

      // 만 19세 이상 나이 검증 추가 필터링 (RA 원자 호출)
      const parseResult = await RA_PARSE_EXTERNAL_AUTH_DATA('MOBILE', mockUserInfo);
      if (!parseResult.success || !parseResult.data) {
        return NextResponse.json({ success: false, message: parseResult.error || '나이 검증에 실패했습니다. (만 19세 미만)' }, { status: 400 });
      }

      // 게스트 세션 쿠키 생성 및 발급
      const sessionResult = await OA_CREATE_GUEST_SESSION(parseResult.data);
      if (!sessionResult.success) {
        return NextResponse.json({ success: false, message: '세션 발급 오류가 발생했습니다.' }, { status: 500 });
      }

      nvLog('FW', '✅ [Mock 인증성공] 게스트 세션 쿠키 발급 완료');
      return NextResponse.json({
        success: true,
        message: '성인 인증이 완료되었습니다. (Mock 모드)',
        data: mockUserInfo
      });
    }

    default:
      return NextResponse.json({ success: false, message: '지원하지 않는 action입니다.' }, { status: 400 });
  }
}
