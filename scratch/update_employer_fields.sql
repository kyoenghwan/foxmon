-- 1. users 테이블에 컬럼 추가
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS business_type VARCHAR(20) DEFAULT '비사업자',
ADD COLUMN IF NOT EXISTS business_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_doc_url VARCHAR(500);

-- 2. Supabase Storage 버킷 생성 (신원 확인 문서용)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification_docs', 
    'verification_docs', 
    false, -- 보안을 위해 private 버킷으로 설정 (관리자만 열람 가능)
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

-- 3. Storage 보안 정책 (인증된 사용자만 자신의 파일 업로드 가능)
-- (Supabase 대시보드에서 직접 설정하는 것이 안전하지만, 자동화를 위해 기본 정책 추가)
CREATE POLICY "인증된 사용자는 파일을 업로드할 수 있습니다"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'verification_docs'
);
