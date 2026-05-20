-- 고객센터: 공지사항, FAQ, 1:1 문의

CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(20) NOT NULL DEFAULT '공지',
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL DEFAULT '영자',
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reply TEXT,
    replied_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notices_pinned_created ON public.notices (is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_category_sort ON public.faqs (category, sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_created ON public.inquiries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries (status, created_at DESC);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notices_public_read" ON public.notices;
CREATE POLICY "notices_public_read" ON public.notices FOR SELECT USING (true);

DROP POLICY IF EXISTS "faqs_public_read" ON public.faqs;
CREATE POLICY "faqs_public_read" ON public.faqs FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "inquiries_own_read" ON public.inquiries;
CREATE POLICY "inquiries_own_read" ON public.inquiries FOR SELECT USING (auth.uid() = user_id);

-- community_comments 대댓글
ALTER TABLE public.community_comments
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE;

-- 초기 공지 (테이블 비어 있을 때만)
INSERT INTO public.notices (category, title, content, is_pinned, author_name, view_count, created_at)
SELECT * FROM (VALUES
    ('공지', '포인트 마켓 베타오픈!', '여우몬 포인트 마켓이 베타 오픈했습니다!' || E'\n' || '자세한 사항은 이벤트 페이지를 참고해주세요.', true, '영자', 8578, '2026-03-28'::timestamptz),
    ('공지', '상단고정 배너 변경', 'PC버전 및 모바일 상단고정 배너의 디자인 및 노출 로직이 변경되었습니다.', true, '영자', 8896, '2026-03-27'::timestamptz),
    ('공지', '모집·채용 시 성차별적 구인광고 금지요청', '남녀고용평등법에 따라 성차별적 구인광고는 법적으로 금지되어 있습니다. 등록 시 주의 부탁드립니다.', true, '영자', 18142, '2026-03-20'::timestamptz),
    ('기타', '사업자번호 조회 오류 수정', '나이스디앤비 사업자번호 조회 API 통신 오류가 수정되어 정상 작동합니다.', false, '영자', 1340, '2026-03-15'::timestamptz),
    ('기타', '서약서 📋', '윤리경영 실천을 위한 서약서 양식이 업데이트되었습니다.', false, '영자', 11974, '2026-03-10'::timestamptz),
    ('공지', '폭스몬 정식 서비스 오픈 안내', '드디어 폭스몬 정식 서비스가 오픈했습니다. 많은 이용 부탁드립니다.', false, '영자', 6703, '2026-03-01'::timestamptz),
    ('기타', '면접쿠폰 발송 재개', '일시 중단되었던 면접쿠폰 알림톡 발송 시스템이 재개되었습니다.', false, '영자', 6217, '2026-02-20'::timestamptz),
    ('공지', '사이트 접속이 원활하지 않았습니다.', 'DB 서버 점검으로 인해 약 20분간 접속이 지연된 점 사과드립니다.', false, '영자', 5482, '2026-02-06'::timestamptz),
    ('기타', '로그인 서버이전(앱 다시 로그인)', '인증 서버 안정화를 위한 이전 작업이 완료되었습니다. 앱 사용자분들은 다시 로그인해주시기 바랍니다.', false, '영자', 6412, '2026-01-10'::timestamptz),
    ('공지', '앱(안드로이드) 업데이트', 'Android OS 14 호환성 개선 업데이트가 완료되었습니다.', false, '영자', 6752, '2025-12-14'::timestamptz)
) AS v(category, title, content, is_pinned, author_name, view_count, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.notices LIMIT 1);

INSERT INTO public.faqs (category, question, answer, sort_order)
SELECT * FROM (VALUES
    ('이용 안내', '회원가입은 어떻게 하나요?', '메인 페이지 우측 상단 [회원가입] 버튼을 클릭하여 진행해주세요. 본인인증(휴대폰) 후 가입이 완료됩니다. 만 19세 이상만 가입 가능합니다.', 1),
    ('이용 안내', '비밀번호를 잊어버렸어요.', '로그인 페이지 하단의 [비밀번호 찾기]를 클릭하시면, 가입 시 등록한 이메일로 비밀번호 재설정 링크가 발송됩니다.', 2),
    ('이용 안내', '회원 탈퇴하고 싶어요.', '마이페이지 > 회원설정 > 맨 하단의 [회원 탈퇴] 버튼을 이용해주세요. 탈퇴 시 작성하신 이력서와 지원 기록은 즉시 삭제되며 복구가 불가능합니다.', 3),
    ('포인트·결제', '포인트 충전은 어떻게 하나요?', '업체관리 > 포인트 관리 메뉴에서 충전 금액을 선택하고 입금자명을 입력 후 [충전 신청]을 해주세요. 무통장 입금 확인 후 영업일 1일 이내에 포인트가 지급됩니다.', 4),
    ('포인트·결제', '포인트 환불은 가능한가요?', '유료 포인트(실결제 포인트)에 한해 환불이 가능합니다. 환불 시 10%의 수수료가 차감되며, 보너스 포인트는 환불 대상이 아닙니다.', 5),
    ('포인트·결제', '등급(VIP/VVIP)은 어떤 혜택이 있나요?', '등급별로 포인트 충전 시 추가 보너스가 지급됩니다. VIP는 10%, VVIP는 20%, VVVIP는 30%의 보너스 적립율이 적용됩니다.', 6),
    ('광고 문의', '광고 등급(프리미엄/스페셜/일반)의 차이점은?', '프리미엄은 메인 상단에 대형 배너로 노출되며, 스페셜은 상단 우선 노출, 일반은 기본 리스트에 표시됩니다.', 7),
    ('광고 문의', '광고는 몇 일 동안 게시되나요?', '기본 30일 단위로 게시됩니다. 만료 전 연장이 가능하며, 포인트가 충분한 경우 자동 연장 옵션도 설정할 수 있습니다.', 8),
    ('이력서·지원', '이력서는 몇 개까지 등록할 수 있나요?', '이력서는 최대 5개까지 등록 가능합니다. 각 이력서마다 공개/비공개 설정이 가능합니다.', 9),
    ('이력서·지원', '지원 취소는 어떻게 하나요?', '마이페이지 > 지원현황에서 [지원 취소] 버튼을 눌러주세요. 단, 업체에서 이미 이력서를 열람한 경우 취소가 제한될 수 있습니다.', 10),
    ('기타', '부적절한 광고를 신고하고 싶어요.', '해당 광고 상세 페이지에서 [신고] 버튼을 클릭하시거나, 1:1 문의에서 "신고·제재" 카테고리로 신고해주세요.', 11)
) AS v(category, question, answer, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.faqs LIMIT 1);
