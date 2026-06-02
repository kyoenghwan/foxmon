import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { StandardResult } from '@/src/atoms/da/common/DA_COMMON_ERROR_TYPES';
import { nvLog } from '@/lib/logger';

export interface PortOneCertificationData {
  imp_uid: string;
  merchant_uid: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | string;
  birthDate: string; // YYYYMMDD 형식으로 정규화
  phoneNumber: string;
  nationality: 'KOREAN' | 'FOREIGNER';
  unique_key?: string; // CI
  unique_in_site?: string; // DI
}

export const QA_PORTONE_GET_CERTIFICATION = async (input: {
  imp_uid: string;
}): Promise<StandardResult<PortOneCertificationData>> => {
  nvLog('AT', '▶️ QA_PORTONE_GET_CERTIFICATION 시작', input);

  const impKey = process.env.PORTONE_API_KEY || process.env.IAMPORT_API_KEY;
  const impSecret = process.env.PORTONE_API_SECRET || process.env.IAMPORT_API_SECRET;

  if (!impKey || !impSecret) {
    nvLog('AT', '❌ QA_PORTONE_GET_CERTIFICATION 실패: 환경변수 누락 (PORTONE_API_KEY, PORTONE_API_SECRET)');
    return {
      success: false,
      errorCode: 'INTERNAL_ERROR',
      message: '서버 본인인증 설정이 올바르지 않습니다. (API Key/Secret 환경변수 누락)'
    };
  }

  try {
    const proxyUrl = process.env.FIXIE_URL;
    const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
    
    if (proxyUrl) {
      nvLog('AT', '🔗 Fixie 프록시 적용 요청', { proxyUrl });
    }

    const client = axios.create({
      httpsAgent,
      proxy: false,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 1. 토큰 발급 받기
    nvLog('AT', '▶️ 포트원 Access Token 요청');
    const tokenRes = await client.post('https://api.iamport.kr/users/getToken', {
      imp_key: impKey,
      imp_secret: impSecret
    });

    const tokenData = tokenRes.data;
    if (tokenData.code !== 0 || !tokenData.response?.access_token) {
      nvLog('AT', '❌ 포트원 Access Token 발급 실패', tokenData);
      return {
        success: false,
        errorCode: 'EXTERNAL_SERVICE_ERROR',
        message: tokenData.message || '인증 토큰 발급에 실패했습니다.'
      };
    }

    const accessToken = tokenData.response.access_token;
    nvLog('AT', '✅ 포트원 Access Token 발급 성공');

    // 2. 본인인증 정보 조회
    nvLog('AT', `▶️ 본인인증 상세 조회 요청: ${input.imp_uid}`);
    const certRes = await client.get(`https://api.iamport.kr/certifications/${input.imp_uid}`, {
      headers: {
        Authorization: accessToken
      }
    });

    const certData = certRes.data;
    if (certData.code !== 0 || !certData.response) {
      nvLog('AT', '❌ 본인인증 상세 조회 실패', certData);
      return {
        success: false,
        errorCode: 'EXTERNAL_SERVICE_ERROR',
        message: certData.message || '본인인증 상세 정보 조회에 실패했습니다.'
      };
    }

    const res = certData.response;
    
    // 생년월일 정규화
    let birthDate = '19900101';
    if (res.birthday) {
      birthDate = res.birthday.replace(/-/g, '');
    } else if (res.birth) {
      const d = new Date(res.birth * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      birthDate = `${yyyy}${mm}${dd}`;
    }

    // 성별 정규화 (MALE/FEMALE)
    let gender = 'MALE';
    if (res.gender) {
      const g = String(res.gender).toLowerCase();
      if (g === 'female' || g === 'f') {
        gender = 'FEMALE';
      }
    }

    // 외국인 여부 정규화
    const nationality = res.foreigner ? 'FOREIGNER' : 'KOREAN';

    const normalizedData: PortOneCertificationData = {
      imp_uid: res.imp_uid,
      merchant_uid: res.merchant_uid,
      name: res.name,
      gender,
      birthDate,
      phoneNumber: res.phone ? res.phone.replace(/-/g, '') : '',
      nationality,
      unique_key: res.unique_key,
      unique_in_site: res.unique_in_site
    };

    nvLog('AT', '✅ QA_PORTONE_GET_CERTIFICATION 완료', { name: normalizedData.name });
    return {
      success: true,
      data: normalizedData
    };

  } catch (error: any) {
    nvLog('AT', '❌ QA_PORTONE_GET_CERTIFICATION 에러', error.message);
    return {
      success: false,
      errorCode: 'EXTERNAL_SERVICE_ERROR',
      message: '포트원 API 서버와의 통신 중 오류가 발생했습니다.',
      errorDetail: error.message
    };
  }
};
