-- [Foxmon] 활동 포인트(activity_points)와 광고 포인트(paid_points, bonus_points) 단일 통합 고도화
-- 놀이터 미니게임 보상 및 커뮤니티 적립금을 users.bonus_points 에 즉시 적립하며, 차감 시 보너스 우선 -> 유료 순서로 실제 포인트를 차감합니다.
-- 모든 거래 내역은 activity_point_transactions 대신 통합 대장인 point_transactions 에 일괄 적재됩니다.

CREATE OR REPLACE FUNCTION process_activity_point(
    p_user_id UUID,
    p_type VARCHAR,
    p_amount BIGINT,
    p_description TEXT
) RETURNS JSONB AS $$
DECLARE
    v_current_paid BIGINT;
    v_current_bonus BIGINT;
    v_new_paid BIGINT;
    v_new_bonus BIGINT;
    v_tx_id UUID;
    v_daily_limit BIGINT;
    v_today_earned BIGINT;
    v_allowed_amount BIGINT;
    v_deduct_amount BIGINT;
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

        -- 1-2. 오늘 KST 자정 이후의 누적 적립금 합 조회 (통합 포인트 대장인 point_transactions에서 조회)
        SELECT COALESCE(SUM(amount), 0) INTO v_today_earned
        FROM point_transactions
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
            v_allowed_amount := v_daily_limit - v_today_earned;
            p_amount := v_allowed_amount;
        END IF;
    END IF;

    -- 2. 사용자 포인트 락 걸고 조회
    SELECT paid_points, bonus_points 
    INTO v_current_paid, v_current_bonus
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_paid IS NULL THEN v_current_paid := 0; END IF;
    IF v_current_bonus IS NULL THEN v_current_bonus := 0; END IF;

    -- 3. 적립 / 차감 계산 분기
    IF p_amount >= 0 THEN
        -- 3-1. 적립인 경우 보너스 포인트에 전액 가산
        v_new_bonus := v_current_bonus + p_amount;
        v_new_paid := v_current_paid;
    ELSE
        -- 3-2. 차감인 경우 (p_amount는 음수임)
        -- 보너스 포인트 우선 차감 후, 모자라면 유료 포인트 차감
        v_deduct_amount := ABS(p_amount);
        
        IF v_current_bonus >= v_deduct_amount THEN
            v_new_bonus := v_current_bonus - v_deduct_amount;
            v_new_paid := v_current_paid;
        ELSE
            v_deduct_amount := v_deduct_amount - v_current_bonus;
            v_new_bonus := 0;
            v_new_paid := v_current_paid - v_deduct_amount;
        END IF;
    END IF;

    -- 잔액 부족 체크
    IF v_new_paid < 0 THEN
        RETURN jsonb_build_object('success', false, 'message', '포인트 잔액이 부족합니다.');
    END IF;

    -- 4. 사용자 테이블 업데이트 (통합 잔액으로 갱신)
    UPDATE users
    SET paid_points = v_new_paid,
        bonus_points = v_new_bonus,
        activity_points = v_new_paid + v_new_bonus -- 레거시 필드도 혹시 모르니 싱크
    WHERE id = p_user_id;

    -- 5. 통합 거래 로그 대장인 point_transactions 에 적재
    INSERT INTO point_transactions (user_id, type, amount, balance_after, description)
    VALUES (p_user_id, p_type, p_amount, v_new_paid + v_new_bonus, p_description)
    RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object('success', true, 'tx_id', v_tx_id, 'balance_after', v_new_paid + v_new_bonus);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
