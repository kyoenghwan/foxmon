-- foxmon_cs 등 운영 계정 비밀번호가 로그인/비밀번호찾기에 안 맞을 때
-- 1) 로컬에서 해시 생성:
--    node scripts/gen-bcrypt-password.mjs "원하는비밀번호"
-- 2) 아래 YOUR_BCRYPT_HASH 를 출력값으로 바꾼 뒤 Supabase SQL Editor 에서 실행

UPDATE users
SET password = 'YOUR_BCRYPT_HASH'
WHERE login_id = 'foxmon_cs';
