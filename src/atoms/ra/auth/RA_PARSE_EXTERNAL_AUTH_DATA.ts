import { nvLog } from '../../../../lib/logger';

interface RawExternalData {
  name: string;
  birthDate: string;
  gender: string;
  phoneNumber: string;
  nationality: 'KOREAN' | 'FOREIGNER';
}

export async function RA_PARSE_EXTERNAL_AUTH_DATA(method: 'PHONE' | 'MOBILE' | 'IPIN' | 'FOREIGNER', data: RawExternalData) {
  nvLog('AT', '▶️ RA_PARSE_EXTERNAL_AUTH_DATA 시작', { method });

  if (!method || !['PHONE', 'MOBILE', 'IPIN', 'FOREIGNER'].includes(method)) {
    return { success: false, error: '유효하지 않은 인증 수단입니다.' };
  }

  if (!data || typeof data.name !== 'string' || !data.name.trim() || typeof data.birthDate !== 'string' || !/^\d{8}$/.test(data.birthDate) || !data.phoneNumber) {
    return { success: false, error: '외부 인증 데이터 누락 (필수값 없음)' };
  }

  // 생년월일(YYYYMMDD) 기준 정확한 만 나이 계산
  const birthYear = parseInt(data.birthDate.substring(0, 4), 10);
  const birthMonth = parseInt(data.birthDate.substring(4, 6), 10);
  const birthDay = parseInt(data.birthDate.substring(6, 8), 10);
  const birth = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay));
  if (birth.getUTCFullYear() !== birthYear || birth.getUTCMonth() + 1 !== birthMonth || birth.getUTCDate() !== birthDay) {
    return { success: false, error: '유효하지 않은 생년월일입니다.' };
  }
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000);
  let age = today.getUTCFullYear() - birthYear;
  // 아직 생일이 지나지 않았으면 만 나이에서 1살 차감
  const monthNow = today.getUTCMonth() + 1;
  if (monthNow < birthMonth || (monthNow === birthMonth && today.getUTCDate() < birthDay)) {
    age--;
  }

  if (age < 19) {
    nvLog('AT', `❌ RA_PARSE_EXTERNAL_AUTH_DATA 만 19세 미만 차단 (만 ${age}세)`);
    return { success: false, error: `만 19세 미만은 접속할 수 없습니다. (현재 만 ${age}세)` };
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
