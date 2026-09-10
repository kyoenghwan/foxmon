const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAllUserIds() {
    // 1. 먼저 users 테이블에서 test1 유저의 모든 데이터 확인
    const { data: user1 } = await supabase.from('users').select('id, login_id, nickname, name, email').eq('login_id', 'test1').maybeSingle();
    console.log("users 테이블 test1:", user1);

    // 2. foxtalk_participants 테이블에서 session_id가 user1.id인 레코드 확인
    if (user1) {
        const { data: parts } = await supabase.from('foxtalk_participants').select('id, session_id, room_id, last_read_at').eq('session_id', user1.id);
        console.log("\nfoxtalk_participants (session_id = user1.id):", parts?.length, "records");
        parts?.forEach((p, i) => {
            console.log(`  [${i}] session_id=${p.session_id}, room_id=${p.room_id}, last_read_at=${p.last_read_at}`);
        });
    }

    // 3. NextAuth sessions 테이블 확인 (next_auth.sessions)
    const { data: sessions, error: sessErr } = await supabase.from('sessions').select('*').limit(5);
    console.log("\nsessions 테이블:", sessions ? sessions.length + " records" : "error: " + sessErr?.message);
    
    // 4. QA_GET_WIDGET_UNREAD_COUNTS와 동일 로직 테스트 (user.id 기반)
    if (user1) {
        const rawUserId = user1.id;
        const normalizedUserId = rawUserId.toLowerCase();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);
        
        const userIdsToMatch = [rawUserId, normalizedUserId];
        
        let userData = null;
        if (isUUID) {
            const { data } = await supabase.from('users').select('id, login_id, nickname').eq('id', rawUserId).maybeSingle();
            userData = data;
        }
        
        if (userData) {
            if (userData.id) userIdsToMatch.push(userData.id);
            if (userData.login_id) userIdsToMatch.push(userData.login_id);
            if (userData.nickname) userIdsToMatch.push(userData.nickname);
        }
        
        const uniqueUserIds = Array.from(new Set(userIdsToMatch.filter(Boolean)));
        const orConditions = uniqueUserIds.map(id => `session_id.eq.${id}`).join(',');
        
        console.log("\n[QA_GET_WIDGET_UNREAD_COUNTS 시뮬레이션]");
        console.log("  rawUserId:", rawUserId);
        console.log("  uniqueUserIds:", uniqueUserIds);
        console.log("  orConditions:", orConditions);
        
        const { data: participants, error: partErr } = await supabase
            .from('foxtalk_participants')
            .select(`id, room_id, last_read_at, foxtalk_rooms!inner(id, type, last_message_at)`)
            .or(orConditions);
        
        console.log("  partErr:", partErr);
        console.log("  participants count:", participants?.length);
        
        let foxTalkUnread = 0;
        let csUnread = 0;
        
        (participants || []).forEach((p) => {
            const room = p.foxtalk_rooms;
            if (!room || !room.last_message_at) return;
            
            const lastReadTime = p.last_read_at ? new Date(p.last_read_at).getTime() : 0;
            const lastMsgTime = new Date(room.last_message_at).getTime();
            
            if (lastMsgTime > lastReadTime + 1000) {
                if (room.type === 'CS') csUnread++;
                else foxTalkUnread++;
            }
            console.log(`  Room ${room.id}: type=${room.type}, lastMsg=${room.last_message_at}, lastRead=${p.last_read_at}, unread=${lastMsgTime > lastReadTime + 1000}`);
        });
        
        console.log(`\n  결과: foxTalkUnread=${foxTalkUnread}, csUnread=${csUnread}, totalUnread=${foxTalkUnread + csUnread}`);
    }
}

testAllUserIds().catch(console.error);
