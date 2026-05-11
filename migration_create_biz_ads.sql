-- ==============================================================================
-- [Foxmon] 광고 배너 테이블 분리 마이그레이션 (biz_ads)
-- ==============================================================================

-- 1. jobs 테이블과 동일한 구조의 biz_ads 테이블 생성 (모든 제약조건, 인덱스 포함)
CREATE TABLE IF NOT EXISTS public.biz_ads (LIKE public.jobs INCLUDING ALL);

-- 2. 외래키 제약조건이 있다면 필요 시 추가 (author_id, company_id 등)
-- (Supabase UI를 통해 Foreign Key 관계 설정 권장)

-- 3. RLS 정책 설정 (jobs와 동일하게 적용)
ALTER TABLE public.biz_ads ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능 (모든 사용자)
CREATE POLICY "Enable read access for all users"
    ON public.biz_ads FOR SELECT
    USING (true);

-- 본인이 작성한 광고만 수정/삭제 가능
CREATE POLICY "Enable update for users based on user_id"
    ON public.biz_ads FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id"
    ON public.biz_ads FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users only"
    ON public.biz_ads FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 4. Supabase Storage 등 연동 (기존 버킷 사용 시 불필요)
