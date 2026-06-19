import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const connStr = 'postgresql://postgres.kgwvftaebjkjwwpsftqv:Rudghks!1@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';
        
        const sql = `
            -- 0. public.execute_sql(sql text) 함수 생성
            CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
            RETURNS text
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              EXECUTE sql;
              RETURN 'OK';
            END;
            $$;

            -- 1. jobs 테이블 제약조건 변경
            ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_tier_check;
            ALTER TABLE public.jobs ADD CONSTRAINT jobs_tier_check CHECK (tier IN ('PREMIUM_MAIN', 'SIDE', 'PREMIUM', 'SPECIAL', 'GENERAL', 'AD_GENERAL'));

            -- 2. biz_ads 테이블 제약조건 변경
            ALTER TABLE public.biz_ads DROP CONSTRAINT IF EXISTS jobs_tier_check;
            ALTER TABLE public.biz_ads DROP CONSTRAINT IF EXISTS biz_ads_tier_check;
            ALTER TABLE public.biz_ads ADD CONSTRAINT jobs_tier_check CHECK (tier IN ('PREMIUM_MAIN', 'SIDE', 'PREMIUM', 'SPECIAL', 'GENERAL', 'AD_GENERAL'));

            -- 3. 사용자 일일 미니게임 참여 로그 테이블 생성
            CREATE TABLE IF NOT EXISTS user_game_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                game_type VARCHAR(50) NOT NULL, -- 'ROULETTE' | 'LUCKY_BOX' | 'ATTENDANCE'
                participation_date DATE NOT NULL DEFAULT CURRENT_DATE,
                reward_amount BIGINT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                CONSTRAINT unique_user_daily_game UNIQUE (user_id, game_type, participation_date)
            );
            CREATE INDEX IF NOT EXISTS idx_user_game_logs_user_id ON user_game_logs(user_id);

            -- 4. 추억의 뽑기판 라운드 회차 테이블 생성
            CREATE TABLE IF NOT EXISTS retro_draw_board (
                board_round SERIAL PRIMARY KEY,
                is_completed BOOLEAN DEFAULT false NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            -- 5. 추억의 뽑기판 100개 종이 쪽지 슬롯 상세 테이블 생성
            CREATE TABLE IF NOT EXISTS retro_draw_slots (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                board_round INTEGER NOT NULL REFERENCES retro_draw_board(board_round) ON DELETE CASCADE,
                slot_number INTEGER NOT NULL, -- 1 ~ 100 번호
                reward_amount BIGINT NOT NULL,
                reward_tier INTEGER NOT NULL, -- 1~5등, 꽝 등등
                user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- 누가 이 딱지를 뜯었는지
                pulled_at TIMESTAMP WITH TIME ZONE,
                CONSTRAINT unique_round_slot UNIQUE (board_round, slot_number)
            );
            CREATE INDEX IF NOT EXISTS idx_retro_draw_slots_board_round ON retro_draw_slots(board_round);
            CREATE INDEX IF NOT EXISTS idx_retro_draw_slots_user_id ON retro_draw_slots(user_id);

            -- 6. RLS 설정
            ALTER TABLE user_game_logs ENABLE ROW LEVEL SECURITY;
            ALTER TABLE retro_draw_board ENABLE ROW LEVEL SECURITY;
            ALTER TABLE retro_draw_slots ENABLE ROW LEVEL SECURITY;

            -- RLS 정책 생성 (에러 방지를 위해 기존 정책이 있으면 삭제 후 생성)
            DROP POLICY IF EXISTS select_own_game_logs ON user_game_logs;
            DROP POLICY IF EXISTS select_retro_board ON retro_draw_board;
            DROP POLICY IF EXISTS select_retro_slots ON retro_draw_slots;

            CREATE POLICY select_own_game_logs ON user_game_logs FOR SELECT USING (auth.uid() = user_id);
            CREATE POLICY select_retro_board ON retro_draw_board FOR SELECT USING (true);
            CREATE POLICY select_retro_slots ON retro_draw_slots FOR SELECT USING (true);

            -- 7. 추억의 뽑기판 100개 무작위 셔플 초기화 RPC 함수
            CREATE OR REPLACE FUNCTION initialize_retro_board_round()
            RETURNS INTEGER AS $$
            DECLARE
                new_round INTEGER;
            BEGIN
                -- 새 회차 생성
                INSERT INTO retro_draw_board DEFAULT VALUES RETURNING board_round INTO new_round;

                -- 100개 보상을 1부터 100까지의 무작위 번호에 셔플 배치하여 insert
                INSERT INTO retro_draw_slots (board_round, slot_number, reward_amount, reward_tier)
                SELECT 
                    new_round,
                    row_number() OVER () AS slot_number,
                    val.reward_amount,
                    val.reward_tier
                FROM (
                    SELECT 5000 AS reward_amount, 1 AS reward_tier FROM generate_series(1, 1) -- 1등: 5,000p 1개
                    UNION ALL
                    SELECT 3000, 2 FROM generate_series(1, 1)                               -- 2등: 3,000p 1개
                    UNION ALL
                    SELECT 2000, 3 FROM generate_series(1, 1)                               -- 3등: 2,000p 1개
                    UNION ALL
                    SELECT 1000, 4 FROM generate_series(1, 2)                               -- 4등: 1,000p 2개
                    UNION ALL
                    SELECT 500, 5 FROM generate_series(1, 5)                                -- 5등: 500p 5개
                    UNION ALL
                    SELECT 100, 6 FROM generate_series(1, 10)                               -- 6등(아차): 100p 10개
                    UNION ALL
                    SELECT 50, 7 FROM generate_series(1, 20)                                -- 7등(아차): 50p 20개
                    UNION ALL
                    SELECT 10, 8 FROM generate_series(1, 30)                                -- 8등(아차): 10p 30개
                    UNION ALL
                    SELECT 0, 9 FROM generate_series(1, 30)                                 -- 꽝: 0p 30개
                ) val
                ORDER BY random();

                RETURN new_round;
            END;
            $$ LANGUAGE plpgsql;
        `;

        const client = new Client({
            connectionString: connStr,
            ssl: { rejectUnauthorized: false }
        });

        await client.connect();
        await client.query(sql);
        await client.end();

        return NextResponse.json({ success: true, message: 'Database successfully migrated from Vercel using direct connection!' });
    } catch (err: any) {
        console.error('❌ Direct migration failed:', err.message);
        return NextResponse.json({ success: false, error: err.message });
    }
}
