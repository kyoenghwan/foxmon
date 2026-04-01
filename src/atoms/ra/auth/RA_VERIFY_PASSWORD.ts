import bcrypt from 'bcryptjs';
import { nvLog } from '../../../../lib/logger';

/**
 * RA_VERIFY_PASSWORD: 입력된 평문 비밀번호와 해시된 비밀번호가 일치하는지 검증합니다.
 * Domain: Auth
 * Type: Rule Atom (Pure Logic wrapped around library)
 */
export const RA_VERIFY_PASSWORD = async (input: { password?: string; hashedPassword?: string }) => {
  if (!input.password || !input.hashedPassword) return { isMatch: false };
  
  try {
    const isMatch = await bcrypt.compare(input.password, input.hashedPassword);
    return { isMatch };
  } catch (error) {
    nvLog('AT', '⚠️ RA_VERIFY_PASSWORD 에러', error);
    return { isMatch: false };
  }
};
