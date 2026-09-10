const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWidgetUnread(userId) {
    if (!userId) return { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 };
    const rawUserId = userId.trim();
    const normalizedUserId = rawUserId.toLowerCase();

    // 1. 유저 참여 채팅방 조회
    const { data: participants, error: partError } = await supabase
        .from('foxtalk_participants')
        .select('id, room_id, last_read_at, foxtalk_rooms!inner(type)')
        .or(`session_id.eq.${rawUserId},session_id.eq.${normalizedUserId}`);

    if (partError || !participants) {
        console.error("Error:", partError);
        return { foxTalkUnread: 0, csUnread: 0, totalUnread: 0 };
    }

    let foxTalkUnread = 0;
    let csUnread = 0;

    for (const p of participants) {
        const lastReadAt = p.last_read_at || '1970-01-01T00:00:00.000Z';
        const { count, error: countErr } = await supabase
            .from('foxtalk_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', p.room_id)
            .neq('participant_id', p.id)
            .gt('created_at', lastReadAt);

        if (count && count > 0) {
            if (p.foxtalk_rooms.type === 'CS') {
                csUnread += 1;
            } else {
                foxTalkUnread += 1;
            }
        }
    }

    return { foxTalkUnread, csUnread, totalUnread: foxTalkUnread + csUnread };
}

async function run() {
    console.log("For 872fa168-e834-4f7b-8a7e-e8c1c73955b0:", await testWidgetUnread('872fa168-e834-4f7b-8a7e-e8c1c73955b0'));
    console.log("For cfdd1fce-adfc-42b9-9093-7846e36f4a54:", await testWidgetUnread('cfdd1fce-adfc-42b9-9093-7846e36f4a54'));
}

run();
