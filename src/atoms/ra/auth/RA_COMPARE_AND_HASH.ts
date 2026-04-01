import bcrypt from 'bcryptjs';
import { nvLog } from '../../../../lib/logger';

export async function RA_COMPARE_AND_HASH(input: {
  dbPassword?: string;
  currentPassword?: string;
  newPassword?: string;
  isPasswordChange: boolean;
}) {
  nvLog('AT', '▶️ RA_COMPARE_AND_HASH 시작');

  if (!input.isPasswordChange) {
    return {
      isValid: true,
      error: null,
      data: { hashedPassword: null }
    };
  }

  if (!input.dbPassword || !input.currentPassword || !input.newPassword) {
    return {
      isValid: false,
      error: '비밀번호 비교에 필요한 정보가 부족합니다.',
      data: null
    };
  }

  try {
    const isMatch = await bcrypt.compare(input.currentPassword, input.dbPassword);
    
    if (!isMatch) {
      nvLog('AT', '❌ 기존 비밀번호 불일치');
      return {
        isValid: false,
        error: '기존 비밀번호가 일치하지 않습니다.',
        data: null
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(input.newPassword, salt);

    nvLog('AT', '✅ RA_COMPARE_AND_HASH 비밀번호 암호화 완료');
    return {
      isValid: true,
      error: null,
      data: { hashedPassword }
    };

  } catch (err: any) {
    nvLog('AT', '❌ RA_COMPARE_AND_HASH 에러', err.message);
    return {
      isValid: false,
      error: '비밀번호 처리 중 오류가 발생했습니다.',
      data: null
    };
  }
}
