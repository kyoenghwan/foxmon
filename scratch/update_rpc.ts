import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { supabaseAdmin } = require('../lib/supabase');

async function test() {
    const sql = `
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
    `;

    console.log('Updating process_activity_point RPC (with bypass lists) in Supabase...');
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success! Updated process_activity_point function successfully.', data);
    }
}

test();
