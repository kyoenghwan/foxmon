import { nvLog } from '../../../../lib/logger';

interface RawExternalData {
  name: string;
  birthDate: string;
  gender: string;
  phoneNumber: string;
  nationality: 'KOREAN' | 'FOREIGNER';
}

export async function RA_PARSE_EXTERNAL_AUTH_DATA(method: 'PHONE' | 'MOBILE' | 'IPIN' | 'FOREIGNER', data: RawExternalData) {
  nvLog('AT', '▶️ RA_PARSE_EXTERNAL_AUTH_DATA 시작', { method, name: data.name });

  if (!method || !['PHONE', 'MOBILE', 'IPIN', 'FOREIGNER'].includes(method)) {
    return { success: false, error: '유효하지 않은 인증 수단입니다.' };
  }

  if (!data.name || !data.birthDate || !data.phoneNumber) {
    return { success: false, error: '외부 인증 데이터 누락 (필수값 없음)' };
  }

  // Calculate age if birthDate is YYYYMMDD
  const birthYear = parseInt(data.birthDate.substring(0, 4), 10);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  if (age < 19) {
    return { success: false, error: '만 19세 미만 접속 불가 (청소년 보호법)' };
  }

  nvLog('AT', '✅ RA_PARSE_EXTERNAL_AUTH_DATA 파싱 및 검증 완료', { age });
  return { 
    success: true, 
    data: {
      ...data,
      isAdult: true,
      verifiedMethod: method
    }
  };
}
