-- 커뮤니티 event 게시판 → 고객센터 공지(카테고리: 이벤트) 이관 (중복 제목+날짜 없을 때만)
INSERT INTO public.notices (category, title, content, author_name, is_pinned, view_count, content_format, created_at)
SELECT
    '이벤트',
    cp.title,
    cp.content,
    COALESCE(cp.author_name, '영자'),
    COALESCE(cp.is_hot, false),
    COALESCE(cp.view_count, 0),
    'markdown',
    cp.created_at
FROM public.community_posts cp
WHERE cp.board_id = 'event'
  AND NOT EXISTS (
    SELECT 1 FROM public.notices n
    WHERE n.title = cp.title AND n.created_at = cp.created_at
  );
