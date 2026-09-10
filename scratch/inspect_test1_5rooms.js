const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect5Rooms() {
    const rawUserId = '872fa168-e834-4f7b-8a7e-e8c1c73955b0';
    
    const { data: participants } = await supabase
        .from('foxtalk_participants')
        .select(`
            id,
            room_id,
            last_read_at,
            foxtalk_rooms!inner(
                id,
                title,
                type,
                last_message_at
            )
        `)
        .eq('session_id', rawUserId);

    console.log("=== test1 유저의 5개 대화방 DB 실제 상태 ===");
    participants.forEach((p, idx) => {
        const room = p.foxtalk_rooms;
        const lastReadTime = p.last_read_at ? new Date(p.last_read_at).getTime() : 0;
        const lastMsgTime = room.last_message_at ? new Date(room.last_message_at).getTime() : 0;
        const diffMs = lastMsgTime - lastReadTime;
        const isUnread = lastMsgTime > lastReadTime;

        console.log(`\n[방 ${idx + 1}] ID: ${room.id} (${room.title || '제목없음'})`);
        console.log(`  - 타입: ${room.type}`);
        console.log(`  - last_message_at: ${room.last_message_at} (${lastMsgTime})`);
        console.log(`  - last_read_at:    ${p.last_read_at} (${lastReadTime})`);
        console.log(`  - 차이(msg - read): ${diffMs} ms`);
        console.log(`  - isUnread 판정:    ${isUnread}`);
    });
}

inspect5Rooms();
