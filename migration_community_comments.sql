-- Table: community_comments

CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

-- 댓글 수 업데이트 함수 (Trigger)
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.community_posts 
        SET comment_count = comment_count + 1 
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.community_posts 
        SET comment_count = comment_count - 1 
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON public.community_comments;
CREATE TRIGGER trigger_update_post_comment_count
AFTER INSERT OR DELETE ON public.community_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comment_count();

-- RLS 정책 추가 (일단 모든 사용자 읽기 가능, 본인만 삭제 가능)
CREATE POLICY "누구나 댓글 조회 가능" ON public.community_comments FOR SELECT USING (true);
-- Insert/Delete는 서버 액션에서 supabaseAdmin을 통해 우회 처리하므로 생략하거나 필요에 따라 추가
