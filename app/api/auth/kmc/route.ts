import { NextResponse } from 'next/server';
import crypto from 'crypto';
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
  try {
    let action = 'token';
    let params: any = {};
    
    try {
      const body = await req.json();
      action = body.action || 'token';
      params = body;
    } catch (e) {
      // JSON 파싱 실패 시 기본 action: token
    }

    const isTestMode = process.env.NEXT_PUBLIC_KMC_TEST_MODE === 'true';
    const isMock = isTestMode && ((await isMockMode()) || params.isMock === true);

    if (isMock) {
      return handleMockAction(action, params);
    }

    // 실제 드림시큐리티 표준창 연동 흐름
    switch (action) {
      case 'token': {
        let { siteUrl } = params;
        if (process.env.NEXT_PUBLIC_KMC_TEST_MODE !== 'true') {
          siteUrl = process.env.KMC_SITE_URL || 'https://foxmon.co.kr';
        }
        
        if (!siteUrl) {
          return NextResponse.json({ success: false, message: 'siteUrl 파라미터가 누락되었습니다.' }, { status: 400 });
        }
        
        try {
          const keyInfo = await decryptMokKeyInfo();
          
          const clientTxId = `foxmon-${crypto.randomBytes(12).toString('hex')}`;
          const requestTime = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
          const reqClientInfo = `${clientTxId}|${requestTime}`;

          const encryptReqClientInfo = encryptKmcTokenRequest(reqClientInfo, keyInfo.ClientPrivateKey);
          
          const usageCode = process.env.KMC_USAGE_CODE || '01016';
          const returnUrl = `${siteUrl}/api/auth/kmc/callback`;
          
          return NextResponse.json({
            usageCode,
            serviceId: keyInfo.ServiceId,
            encryptReqClientInfo,
            serviceType: 'telcoAuth',
            retTransferType: 'MOKToken',
            returnUrl,
            clientTxId
          });
        } catch (err: any) {
          return NextResponse.json({ success: false, message: `KMC 토큰 데이터 생성 오류: ${err.message}` }, { status: 500 });
        }
      }

      case 'confirm': {
        const { encryptMOKKeyToken } = params;
        if (!encryptMOKKeyToken) {
          return NextResponse.json({ success: false, message: '필수 검증 파라미터(encryptMOKKeyToken)가 누락되었습니다.' }, { status: 400 });
        }

        const confirmResult = await confirmMokStandardAuth({ encryptMOKKeyToken });

        if (!confirmResult.success || !confirmResult.userInfo) {
          return NextResponse.json({ success: false, message: confirmResult.message }, { status: 400 });
        }

        // 만 19세 이상 나이 검증
        const parseResult = await RA_PARSE_EXTERNAL_AUTH_DATA('MOBILE', confirmResult.userInfo);
        if (!parseResult.success || !parseResult.data) {
          return NextResponse.json({ success: false, message: parseResult.error || '나이 검증에 실패했습니다.' }, { status: 400 });
        }

        // 게스트 세션 쿠키 생성 및 발급
        const sessionResult = await OA_CREATE_GUEST_SESSION(parseResult.data);
        if (!sessionResult.success) {
          return NextResponse.json({ success: false, message: '세션 발급 오류가 발생했습니다.' }, { status: 500 });
        }

        // 로그인된 사용자의 CI가 비어있으면 자동 업데이트 (기존 회원 CI 채우기)
        if (confirmResult.userInfo.ci) {
          try {
            const { auth } = await import('@/auth');
            const session = await auth();
            if (session?.user?.id) {
              const { supabase } = await import('@/lib/supabase');
              const { data: existingUser } = await supabase
                .from('users')
                .select('ci')
                .eq('id', session.user.id)
                .single();
              
              if (existingUser && !existingUser.ci) {
                await supabase
                  .from('users')
                  .update({ ci: confirmResult.userInfo.ci })
                  .eq('id', session.user.id);
              }
            }
          } catch (_) {
            // CI 업데이트 실패는 무시 (메인 흐름에 영향 없음)
          }
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
    return NextResponse.json({ success: false, message: `서버 내부 에러: ${err.message}` }, { status: 500 });
  }
}

/**
 * 키 파일이 없을 때 즉시 프론트 및 가입 테스트를 진행하기 위한 Mock 응답 시뮬레이션
 */
async function handleMockAction(action: string, params: any) {
  switch (action) {
    case 'token':
      return NextResponse.json({
        usageCode: '01016',
        serviceId: 'MOCK_SERVICE_ID',
        encryptReqClientInfo: 'MOCK_ENCRYPTED_REQ_INFO_RSA_OAEP',
        serviceType: 'telcoAuth',
        retTransferType: 'MOKToken',
        returnUrl: `${params.siteUrl || 'https://foxmon.co.kr'}/api/auth/kmc/callback`,
        clientTxId: 'MOCK_TX_ID_' + Math.random().toString(36).substring(7)
      });

    case 'confirm': {
      const { encryptMOKKeyToken } = params;
      
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

      // 만 19세 이상 나이 검증
      const parseResult = await RA_PARSE_EXTERNAL_AUTH_DATA('MOBILE', mockUserInfo);
      if (!parseResult.success || !parseResult.data) {
        return NextResponse.json({ success: false, message: parseResult.error || '나이 검증에 실패했습니다. (만 19세 미만)' }, { status: 400 });
      }

      // 게스트 세션 쿠키 생성 및 발급
      const sessionResult = await OA_CREATE_GUEST_SESSION(parseResult.data);
      if (!sessionResult.success) {
        return NextResponse.json({ success: false, message: '세션 발급 오류가 발생했습니다.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '성인 인증이 완료되었습니다. (Mock 모드)',
        data: mockUserInfo
      });
    }

    default:
      return NextResponse.json({ success: false, message: '지원하지 않는 Mock action입니다.' }, { status: 400 });
  }
}
