import bcrypt from 'bcryptjs';
import { nvLog } from '../../../../lib/logger';

/**
 * RA_HASH_PASSWORD: 비밀번호를 안전하게 해싱합니다.
 */
export async function RA_HASH_PASSWORD(password: string): Promise<{ data: string }> {
  nvLog('AT', '▶️ RA_HASH_PASSWORD 시작');
  
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  return { data: hash };
}
