-- 1. community_post_likes 테이블 생성
CREATE TABLE IF NOT EXISTS community_post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_post_like UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_user ON community_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post ON community_post_likes(post_id);

-- 2. community_posts 테이블에 like_count 추가
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS like_count BIGINT NOT NULL DEFAULT 0;

-- 3. RLS 활성화
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can toggle their own likes" ON community_post_likes;
CREATE POLICY "Users can toggle their own likes" ON community_post_likes
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Everyone can view likes" ON community_post_likes;
CREATE POLICY "Everyone can view likes" ON community_post_likes
    FOR SELECT TO public USING (true);

-- 4. process_activity_point 함수 고도화 및 교체
CREATE OR REPLACE FUNCTION process_activity_point(
    p_user_id UUID,
    p_type VARCHAR,
    p_amount BIGINT,
    p_description TEXT
) RETURNS JSONB AS $$
DECLARE
    v_current_points BIGINT;
    v_new_points BIGINT;
    v_tx_id UUID;
    v_daily_limit BIGINT;
    v_today_earned BIGINT;
    v_allowed_amount BIGINT;
BEGIN
    -- 1. 적립(p_amount > 0)인 경우에만 일일 한도 체크
    -- 단, 가입 추천인(REFERRAL_SIGNUP), 추천 가입(REFERRAL_BONUS), 게임 관련(GAME_REWARD, GAME_PLAY, ROULETTE), 연속 출석 보상(ATTENDANCE_STREAK_3, 7, 15, 30), 공감 보상(LIKE_RECEIVED)은 일일 한도 예외 처리
    IF p_amount > 0 AND p_type NOT IN (
        'REFERRAL_SIGNUP', 'REFERRAL_BONUS', 
        'GAME_REWARD', 'GAME_PLAY', 'ROULETTE',
        'ATTENDANCE_STREAK_3', 'ATTENDANCE_STREAK_7', 'ATTENDANCE_STREAK_15', 'ATTENDANCE_STREAK_30',
        'LIKE_RECEIVED'
    ) THEN
        -- 1-1. 설정된 일일 한도 가져오기 (기본값 5000)
        SELECT COALESCE((SELECT config_value FROM point_policies WHERE config_key = 'LIMIT_DAILY_MAX_EARN_POINTS' LIMIT 1), 5000)
        INTO v_daily_limit;

        -- 1-2. 오늘 KST 자정 이후의 누적 적립금 합 조회 (예외 타입은 합산에서 제외)
        SELECT COALESCE(SUM(amount), 0) INTO v_today_earned
        FROM activity_point_transactions
        WHERE user_id = p_user_id
          AND amount > 0
          AND type NOT IN (
              'REFERRAL_SIGNUP', 'REFERRAL_BONUS', 
              'GAME_REWARD', 'GAME_PLAY', 'ROULETTE',
              'ATTENDANCE_STREAK_3', 'ATTENDANCE_STREAK_7', 'ATTENDANCE_STREAK_15', 'ATTENDANCE_STREAK_30',
              'LIKE_RECEIVED'
          )
          AND created_at >= (timezone('Asia/Seoul', now())::date)::timestamp;

        -- 1-3. 한도 체크
        IF v_today_earned >= v_daily_limit THEN
            RETURN jsonb_build_object('success', false, 'message', '오늘 적립할 수 있는 최대 보너스 한도를 초과하여 더 이상 적립되지 않습니다.');
        ELSIF (v_today_earned + p_amount) > v_daily_limit THEN
            -- 남은 한도만큼만 적립금 조정 (부분 적립 허용)
            v_allowed_amount := v_daily_limit - v_today_earned;
            p_amount := v_allowed_amount;
        END IF;
    END IF;

    -- 2. 사용자 활동 포인트 락 걸고 조회
    SELECT activity_points INTO v_current_points
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_points IS NULL THEN
        v_current_points := 0;
    END IF;

    v_new_points := v_current_points + p_amount;

    -- 포인트가 마이너스가 되는 차감 거래(글 삭제, 공감 취소 등)는 마이너스 잔고 허용
    -- 단, 양수 보너스 적립 시점에 마이너스가 되는 비정상 로직에 대해서만 방어 (거의 불가능)
    IF v_new_points < 0 AND p_amount >= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', '포인트 잔액이 부족합니다.');
    END IF;

    -- 사용자 포인트 업데이트
    UPDATE users
    SET activity_points = v_new_points
    WHERE id = p_user_id;

    -- 거래 원장 인서트
    INSERT INTO activity_point_transactions (user_id, type, amount, balance_after, description)
    VALUES (p_user_id, p_type, p_amount, v_new_points, p_description)
    RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object('success', true, 'tx_id', v_tx_id, 'balance_after', v_new_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
