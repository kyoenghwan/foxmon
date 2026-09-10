const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testO1Unread(userId) {
    const rawUserId = userId.trim();
    const normalizedUserId = rawUserId.toLowerCase();

    // 1. 유저 참여 대화방과 방의 last_message_at 조회
    const { data: participants, error } = await supabase
        .from('foxtalk_participants')
        .select(`
            id,
            room_id,
            last_read_at,
            foxtalk_rooms!inner(
                id,
                type,
                last_message_at
            )
        `)
        .or(`session_id.eq.${rawUserId},session_id.eq.${normalizedUserId}`);

    if (error || !participants) {
        console.error("Error:", error);
        return { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 };
    }

    let foxTalkUnread = 0;
    let csUnread = 0;

    participants.forEach((p) => {
        const room = p.foxtalk_rooms;
        if (!room || !room.last_message_at) return;

        const lastReadTime = p.last_read_at ? new Date(p.last_read_at).getTime() : 0;
        const lastMsgTime = new Date(room.last_message_at).getTime();

        // 1초(1000ms) 이상 차이나야 진짜 새 메시지로 판정 (읽음 처리 시점의 소수점 오차 방지)
        if (lastMsgTime > lastReadTime + 1000) {
            if (room.type === 'CS') {
                csUnread += 1;
            } else {
                foxTalkUnread += 1;
            }
            console.log(`[UNREAD FOUND] Room ${room.id} (${room.type}): lastMsgTime=${lastMsgTime}, lastReadTime=${lastReadTime}`);
        }
    });

    return { foxTalkUnread, csUnread, totalUnread: foxTalkUnread + csUnread };
}

async function run() {
    console.log("Result for 872fa168-e834-4f7b-8a7e-e8c1c73955b0:", await testO1Unread('872fa168-e834-4f7b-8a7e-e8c1c73955b0'));
}

run();
