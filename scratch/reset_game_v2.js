const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgwvftaebjkjwwpsftqv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM');

async function resetAndCreateNewBoard() {
    const kstOffset = 9 * 60 * 60 * 1000;
    const todayKstStr = new Date(Date.now() + kstOffset).toISOString().split('T')[0];
    console.log("KST Today Date:", todayKstStr);

    // 1. 오늘 날짜 게임 로그 삭제 (기회 복구) 및 2. RLS 우회하여 새 뽑기판 개설
    const sql = `
        -- 오늘 날짜 게임 로그 삭제
        DELETE FROM public.user_game_logs 
        WHERE user_id = (SELECT id FROM public.users WHERE nickname = 'kyoenghwan' LIMIT 1)
          AND participation_date = '${todayKstStr}';

        -- RLS 우회하여 새 뽑기판 개설
        SELECT initialize_retro_board_round();
    `;
    
    console.log("Executing SQL reset & board initialization via execute_sql RPC...");
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
        console.error("Initialization SQL Error:", error);
    } else {
        console.log("Initialization SQL Result:", data || "Successfully reset logs and created a new shuffled board!");
    }
}

resetAndCreateNewBoard();
