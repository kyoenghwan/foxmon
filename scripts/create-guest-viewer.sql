-- 외부 감시자(뷰어) guest_001 계정 생성 SQL
-- 비밀번호: guest1234!
INSERT INTO users (
  login_id,
  password,
  name,
  nickname,
  role,
  birth_date,
  age,
  gender,
  phone_number,
  nationality,
  is_age_verified
) VALUES (
  'guest_001',
  '$2b$10$soMw1F7kB2HRDaD3IJ03COczyyR7CJDzD5dF0Y0CwYmUU1Ev7RoF2',
  '외부감시자',
  '감시요원',
  'VIEWER',
  '19900101',
  36,
  'MALE',
  '010-0000-0000',
  'KOREAN',
  true
) ON CONFLICT (login_id) DO UPDATE SET
  role = 'VIEWER',
  name = '외부감시자',
  nickname = '감시요원',
  is_age_verified = true;
