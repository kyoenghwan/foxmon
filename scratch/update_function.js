const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgwvftaebjkjwwpsftqv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM');

async function update() {
    const sql = `
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
                shuffled.reward_amount,
                shuffled.reward_tier
            FROM (
                SELECT reward_amount, reward_tier
                FROM (
                    SELECT 3000 AS reward_amount, 1 AS reward_tier FROM generate_series(1, 1) -- 1등: 3,000p 1개
                    UNION ALL
                    SELECT 2000, 2 FROM generate_series(1, 1)                               -- 2등: 2,000p 1개
                    UNION ALL
                    SELECT 1000, 3 FROM generate_series(1, 1)                               -- 3등: 1,000p 1개
                    UNION ALL
                    SELECT 800, 4 FROM generate_series(1, 2)                                -- 4등: 800p 2개
                    UNION ALL
                    SELECT 400, 5 FROM generate_series(1, 5)                                -- 5등: 400p 5개
                    UNION ALL
                    SELECT 100, 6 FROM generate_series(1, 10)                               -- 6등: 100p 10개
                    UNION ALL
                    SELECT 50, 7 FROM generate_series(1, 20)                                -- 7등: 50p 20개
                    UNION ALL
                    SELECT 30, 8 FROM generate_series(1, 30)                                -- 8등: 30p 30개
                    UNION ALL
                    SELECT 10, 9 FROM generate_series(1, 30)                                -- 9등: 10p 30개
                ) val
                ORDER BY random()
            ) shuffled;

            RETURN new_round;
        END;
        $$ LANGUAGE plpgsql;
    `;

    console.log("Updating initialize_retro_board_round database function with new rewards...");
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
        console.error("SQL Function Update Error:", error);
    } else {
        console.log("SQL Function Update Output:", data || "Successfully updated function definition!");
    }
}

update();
