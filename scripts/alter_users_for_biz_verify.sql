-- 업체 회원(employers) 또는 통합 회원(users) 테이블에 사업자 인증 관련 필드를 추가합니다.
-- Foxmon 프로젝트는 users 테이블에 role('employer' 등)로 구분한다고 가정합니다.

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_business_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_business_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_cert_image_url TEXT,
ADD COLUMN IF NOT EXISTS last_biz_verified_at TIMESTAMP WITH TIME ZONE;

-- 추가 설명:
-- business_registration_number: 10자리 사업자등록번호
-- is_business_verified: 국세청 API를 통해 진위확인이 완료되었는지 여부
-- verified_business_name: 인증된 상호명 (AdEditorForm에서 ReadOnly로 불러올 값)
-- business_cert_image_url: 업태/종목 수동 확인용 사업자등록증 이미지 주소
-- last_biz_verified_at: 마지막으로 국세청 폐업조회(Cron)를 실행한 시간
