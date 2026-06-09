-- 1. 기존 'report' (업소제보)로 작성된 글의 board_id를 'reviews' (업소후기·제보)로 일괄 마이그레이션
UPDATE public.community_posts
SET board_id = 'reviews'
WHERE board_id = 'report';

-- 2. 기존 'secret' (비밀게시판)으로 작성된 글은 프라이버시 보호를 위해 삭제 조치 (혹은 임시 이관을 원할 시 백업 권장)
DELETE FROM public.community_posts
WHERE board_id = 'secret';
