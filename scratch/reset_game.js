const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgwvftaebjkjwwpsftqv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM');

async function reset() {
    const kstOffset = 9 * 60 * 60 * 1000;
    const todayKstStr = new Date(Date.now() + kstOffset).toISOString().split('T')[0];
    console.log("KST Today Date:", todayKstStr);

    const sql = `
        -- 1. 오늘 날짜 게임 로그 삭제
        DELETE FROM public.user_game_logs 
        WHERE user_id = (SELECT id FROM public.users WHERE nickname = 'kyoenghwan' LIMIT 1)
          AND participation_date = '${todayKstStr}';

        -- 2. 종이뽑기 슬롯들 초기화 (WHERE 우회 조건 추가)
        UPDATE public.retro_draw_slots
        SET user_id = NULL,
            pulled_at = NULL
        WHERE id IS NOT NULL;
    `;

    console.log("Executing SQL reset queries via Supabase RPC...");
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
        console.error("SQL Reset Error:", error);
    } else {
        console.log("Reset Output:", data || "Successfully reset user games and slot board!");
    }
}

reset();
