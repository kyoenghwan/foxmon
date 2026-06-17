import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { nvLog } from '@/lib/logger';
import { 
  decryptMokKeyInfo, 
  encryptKmcTokenRequest, 
  confirmMokStandardAuth, 
  isMockMode, 
  KmcUserInfo 
} from '@/lib/kmc-service';
import { OA_CREATE_GUEST_SESSION } from '@/src/atoms/oa/auth/OA_CREATE_GUEST_SESSION';
import { RA_PARSE_EXTERNAL_AUTH_DATA } from '@/src/atoms/ra/auth/RA_PARSE_EXTERNAL_AUTH_DATA';

export async function POST(req: Request) {
  const trace: string[] = [];
  try {
    let action = 'token';
    let params: any = {};
    
    try {
      const body = await req.json();
      action = body.action || 'token';
      params = body;
    } catch (e) {
      trace.push('📡 [API_ROUTE] JSON 파싱 실패 또는 바디 없음. 기본 action: [token] 설정');
    }

    nvLog('FW', `▶️ KMC API 요청 수신 - action: ${action}`);

    const isTestMode = process.env.NEXT_PUBLIC_KMC_TEST_MODE === 'true';
    const isMock = isTestMode && ((await isMockMode()) || params.isMock === true);

    if (isMock) {
      nvLog('FW', '⚠️ Mock 모드로 요청을 시뮬레이션합니다.');
      return handleMockAction(action, params);
    }

    // 실제 드림시큐리티 표준창 연동 흐름
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
          const keyInfo = await decryptMokKeyInfo(trace);
          
          // 1. 거래 ID 생성 (20자 이상 40자 이내 고유값)
          const clientTxId = `foxmon-${crypto.randomBytes(12).toString('hex')}`;
          trace.push(`📡 [API_ROUTE] clientTxId 생성: [${clientTxId}]`);
          
          // 2. 현재 요청 시간 (YYYYMMDDHHmmss)
          const requestTime = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
          
          // 3. 거래요청정보 평문 생성 및 RSA 암호화
          const reqClientInfo = `${clientTxId}|${requestTime}`;
          const encryptReqClientInfo = encryptKmcTokenRequest(reqClientInfo, keyInfo.ServerPublicKey);
          
          const usageCode = process.env.KMC_USAGE_CODE || '01016'; // 기본 성인인증용(01016)
          const returnUrl = `${siteUrl}/api/auth/kmc/callback`;
          
          const responseData = {
            usageCode,
            serviceId: keyInfo.ServiceId,
            encryptReqClientInfo,
            serviceType: 'telcoAuth',
            retTransferType: 'MOKToken',
            returnUrl,
            clientTxId
          };
          
          return NextResponse.json({ success: true, data: responseData, trace });
        } catch (err: any) {
          return NextResponse.json({ success: false, message: `KMC 토큰 데이터 생성 오류: ${err.message}`, trace }, { status: 500 });
        }
      }

      case 'confirm': {
        const { encryptMOKKeyToken } = params;
        if (!encryptMOKKeyToken) {
          return NextResponse.json({ success: false, message: '필수 검증 파라미터(encryptMOKKeyToken)가 누락되었습니다.', trace }, { status: 400 });
        }

        const confirmResult = await confirmMokStandardAuth({
          encryptMOKKeyToken
        }, trace);

        if (!confirmResult.success || !confirmResult.userInfo) {
          return NextResponse.json({ success: false, message: confirmResult.message, trace }, { status: 400 });
        }

        // 만 19세 이상 나이 검증 추가 필터링 (RA 원자 호출)
        const parseResult = await RA_PARSE_EXTERNAL_AUTH_DATA('MOBILE', confirmResult.userInfo);
        if (!parseResult.success || !parseResult.data) {
          return NextResponse.json({ success: false, message: parseResult.error || '나이 검증에 실패했습니다.', trace }, { status: 400 });
        }

        // 게스트 세션 쿠키 생성 및 발급
        const sessionResult = await OA_CREATE_GUEST_SESSION(parseResult.data);
        if (!sessionResult.success) {
          return NextResponse.json({ success: false, message: '세션 발급 오류가 발생했습니다.', trace }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: '성인 인증이 완료되었습니다.',
          data: confirmResult.userInfo,
          trace
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
          usageCode: '01016',
          serviceId: 'MOCK_SERVICE_ID',
          encryptReqClientInfo: 'MOCK_ENCRYPTED_REQ_INFO_RSA_OAEP',
          serviceType: 'telcoAuth',
          retTransferType: 'MOKToken',
          returnUrl: `${params.siteUrl || 'https://foxmon.co.kr'}/api/auth/kmc/callback`,
          clientTxId: 'MOCK_TX_ID_' + Math.random().toString(36).substring(7)
        }
      });

    case 'confirm': {
      const { encryptMOKKeyToken } = params;
      
      // Mock 토큰 데이터 검증
      if (!encryptMOKKeyToken || (!encryptMOKKeyToken.startsWith('MOCK_KEY_TOKEN') && !encryptMOKKeyToken.startsWith('MOCK_TOKEN'))) {
        return NextResponse.json({ success: false, message: '올바른 Mock 토큰 정보가 아닙니다.' }, { status: 400 });
      }

      const mockUserInfo: KmcUserInfo = {
        name: '홍길동',
        birthDate: '19900101',
        gender: 'MALE',
        phoneNumber: '01012345678',
        nationality: 'KOREAN',
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
