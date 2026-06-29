-- 1. users 테이블에 일반 사용자 활동 포인트 잔액 및 추천인 ID 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_points BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES users(id);

-- 2. 출석 체크 테이블 생성
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- 동일 사용자가 하루에 단 한 번만 출석할 수 있도록 유니크 제약
    CONSTRAINT unique_user_daily_attendance UNIQUE (user_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(attendance_date);

-- 3. 활동 포인트 거래 로그 테이블 (원장 관리)
CREATE TABLE IF NOT EXISTS activity_point_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'POST' | 'COMMENT' | 'ATTENDANCE' | 'REFERRAL_SIGNUP' | 'REFERRAL_BONUS' | 'GIFT_CARD_REQUEST' | 'ADMIN_ADJUST'
    amount BIGINT NOT NULL, -- 증감액 (+ / -)
    balance_after BIGINT NOT NULL, -- 거래 후 최종 잔액
    description TEXT, -- 거래 사유 상세 설명
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_point_transactions_user_id ON activity_point_transactions(user_id);

-- 4. 상품권 교환 신청 테이블
CREATE TABLE IF NOT EXISTS gift_card_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gift_card_type VARCHAR(100) NOT NULL, -- 'CULTURE_LAND' | 'HAPPY_MONEY' | 'GOOGLE_PLAY'
    amount BIGINT NOT NULL, -- 신청 포인트 금액
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'REJECTED'
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gift_card_requests_user_id ON gift_card_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_requests_status ON gift_card_requests(status);

-- 5. RLS (Row Level Security) 설정
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_requests ENABLE ROW LEVEL SECURITY;

-- 비회원이 자기 데이터를 마음대로 조작하는 것을 막고, 서버의 Admin Bypass 위주로 작업하기 위해 
-- 사용자는 자신의 로그만 조회 가능하도록 정책 부여

DROP POLICY IF EXISTS "Users can view own attendance logs" ON attendance_logs;
CREATE POLICY "Users can view own attendance logs" ON attendance_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own point transactions" ON activity_point_transactions;
CREATE POLICY "Users can view own point transactions" ON activity_point_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own gift card requests" ON gift_card_requests;
CREATE POLICY "Users can view own gift card requests" ON gift_card_requests
    FOR SELECT USING (auth.uid() = user_id);

-- 6. 트랜잭션 안전성 보장 PL/pgSQL 함수 생성

-- 6-1. 포인트 적립/차감 처리 함수
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
    -- 단, 가입 추천인(REFERRAL_SIGNUP), 추천 가입(REFERRAL_BONUS), 게임 관련(GAME_REWARD, GAME_PLAY, ROULETTE)은 일일 한도 예외 처리
    IF p_amount > 0 AND p_type NOT IN ('REFERRAL_SIGNUP', 'REFERRAL_BONUS', 'GAME_REWARD', 'GAME_PLAY', 'ROULETTE') THEN
        -- 1-1. 설정된 일일 한도 가져오기 (기본값 5000)
        SELECT COALESCE((SELECT config_value FROM point_policies WHERE config_key = 'LIMIT_DAILY_MAX_EARN_POINTS' LIMIT 1), 5000)
        INTO v_daily_limit;

        -- 1-2. 오늘 KST 자정 이후의 누적 적립금 합 조회 (예외 타입은 합산에서 제외)
        SELECT COALESCE(SUM(amount), 0) INTO v_today_earned
        FROM activity_point_transactions
        WHERE user_id = p_user_id
          AND amount > 0
          AND type NOT IN ('REFERRAL_SIGNUP', 'REFERRAL_BONUS', 'GAME_REWARD', 'GAME_PLAY', 'ROULETTE')
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

    -- 포인트가 마이너스가 되지 않도록 방어
    IF v_new_points < 0 THEN
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

-- 6-2. 상품권 교환 신청 및 차감 처리 함수
CREATE OR REPLACE FUNCTION request_gift_card_redemption(
    p_user_id UUID,
    p_gift_card_type VARCHAR,
    p_amount BIGINT
) RETURNS JSONB AS $$
DECLARE
    v_current_points BIGINT;
    v_new_points BIGINT;
    v_req_id UUID;
    v_tx_id UUID;
BEGIN
    -- 포인트 조회 및 락
    SELECT activity_points INTO v_current_points
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_points IS NULL OR v_current_points < p_amount THEN
        RETURN jsonb_build_object('success', false, 'message', '교환에 필요한 포인트가 부족합니다.');
    END IF;

    v_new_points := v_current_points - p_amount;

    -- 상품권 신청 내역 추가
    INSERT INTO gift_card_requests (user_id, gift_card_type, amount, status)
    VALUES (p_user_id, p_gift_card_type, p_amount, 'PENDING')
    RETURNING id INTO v_req_id;

    -- 사용자 포인트 차감
    UPDATE users
    SET activity_points = v_new_points
    WHERE id = p_user_id;

    -- 포인트 거래로그 차감 기록
    INSERT INTO activity_point_transactions (user_id, type, amount, balance_after, description)
    VALUES (p_user_id, 'GIFT_CARD_REQUEST', -p_amount, v_new_points, p_gift_card_type || ' 상품권 교환 신청 차감')
    RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true, 
        'request_id', v_req_id, 
        'tx_id', v_tx_id, 
        'balance_after', v_new_points
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
