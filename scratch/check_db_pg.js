const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        
        // 1. 유저 조회
        const userRes = await client.query("SELECT id, nickname, email FROM public.users WHERE nickname = 'kyoenghwan' LIMIT 1");
        console.log("User Row:", userRes.rows);

        if (userRes.rows.length > 0) {
            const userId = userRes.rows[0].id;
            
            // 2. 오늘자 게임 로그 조회 (KST 기준)
            const logRes = await client.query(`
                SELECT id, game_type, participation_date, created_at 
                FROM public.user_game_logs 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 5
            `, [userId]);
            console.log("Game Logs:", logRes.rows);
            
            // 3. 오늘자 retro_draw_slots 점유 현황 조회
            const slotRes = await client.query(`
                SELECT id, board_round, slot_number, user_id, is_pulled, reward_amount, reward_tier 
                FROM public.retro_draw_slots 
                WHERE user_id = $1 
                LIMIT 10
            `, [userId]);
            console.log("User Slots:", slotRes.rows);
        }
    } catch(err) {
        console.error("PG Error:", err);
    } finally {
        await client.end();
    }
}
check();
