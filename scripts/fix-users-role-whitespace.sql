-- role / staff_team 에 줄바꿈·공백이 섞인 경우 (로그인·관리 API 오동작 방지)
UPDATE users
SET
  role = TRIM(BOTH FROM role),
  staff_team = NULLIF(TRIM(BOTH FROM staff_team), '')
WHERE role ~ E'[\\s\\r\\n]' OR staff_team ~ E'[\\s\\r\\n]';
