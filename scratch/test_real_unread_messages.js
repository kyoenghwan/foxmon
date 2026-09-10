const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealUnread() {
    const rawUserId = '872fa168-e834-4f7b-8a7e-e8c1c73955b0';
    const normalizedUserId = rawUserId.toLowerCase();

    // 1. 유저의 참여 정보 조회
    const { data: participants } = await supabase
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

    console.log("Participants count:", participants ? participants.length : 0);

    let foxTalkUnread = 0;
    let csUnread = 0;

    for (const p of (participants || [])) {
        const room = p.foxtalk_rooms;
        if (!room) continue;

        const lastReadAt = p.last_read_at || '1970-01-01T00:00:00.000Z';

        // 해당 방에서 내가 아닌 다른 사람이 보낸 메시지 중 내 last_read_at 이후에 작성된 것이 있는지 조회
        const { count, error } = await supabase
            .from('foxtalk_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', p.room_id)
            .neq('participant_id', p.id)
            .gt('created_at', lastReadAt);

        console.log(`Room ${p.room_id} (${room.type}): MyPartID=${p.id}, LastReadAt=${lastReadAt}, UnreadFromOthersCount=${count}`);

        if (!error && count && count > 0) {
            if (room.type === 'CS') {
                csUnread += 1;
            } else {
                foxTalkUnread += 1;
            }
        }
    }

    console.log("Final Unread:", { foxTalkUnread, csUnread, totalUnread: foxTalkUnread + csUnread });
}

checkRealUnread();
