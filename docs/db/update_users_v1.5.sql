-- ========================================
-- [V1.5] 사용자 테이블(users) 확장 속성 추가 스크립트
-- ========================================
-- 이 스크립트를 Supabase SQL 에디터 혹은 psql 콘솔에서 실행해주십시오.

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS "profile_image_url" TEXT,
ADD COLUMN IF NOT EXISTS "sns_kakao" TEXT,
ADD COLUMN IF NOT EXISTS "sns_instagram" TEXT,
ADD COLUMN IF NOT EXISTS "sns_telegram" TEXT,
ADD COLUMN IF NOT EXISTS "sns_x" TEXT;

-- 주석(Comment) 추가 (Supabase Data View 용이성 확보)
COMMENT ON COLUMN public.users.profile_image_url IS '프로필 사진 URL';
COMMENT ON COLUMN public.users.sns_kakao IS '카카오톡 아이디/링크';
COMMENT ON COLUMN public.users.sns_instagram IS '인스타그램 아이디/링크';
COMMENT ON COLUMN public.users.sns_telegram IS '텔레그램 아이디/링크';
COMMENT ON COLUMN public.users.sns_x IS 'X(구 트위터) 아이디/링크';

-- 실행 검증:
-- SELECT column_name FROM information_schema.columns WHERE table_name='users';
