/**
 * users.password 에 넣을 bcrypt 해시 생성
 * 사용: node scripts/gen-bcrypt-password.mjs "새비밀번호"
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('사용법: node scripts/gen-bcrypt-password.mjs "새비밀번호"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log(hash);
console.log('\n-- Supabase SQL 예시 --');
console.log(`UPDATE users SET password = '${hash}' WHERE login_id = 'foxmon_cs';`);
