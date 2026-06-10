-- 기존 오염된 모든 게시글의 댓글 수(comment_count)를 실제 댓글(community_comments) 테이블 개수로 일괄 동기화(정정)하는 쿼리
UPDATE public.community_posts p
SET comment_count = (
    SELECT COALESCE(COUNT(*), 0)
    FROM public.community_comments c
    WHERE c.post_id = p.id
);
