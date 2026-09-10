const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function compareMethods() {
    const rawUserId = '872fa168-e834-4f7b-8a7e-e8c1c73955b0';
    const normalizedUserId = rawUserId.toLowerCase();

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

    console.log("Found participants:", participants ? participants.length : 0);

    participants.forEach((p) => {
        const room = p.foxtalk_rooms;
        const lastReadTime = p.last_read_at ? new Date(p.last_read_at).getTime() : 0;
        const lastMsgTime = room && room.last_message_at ? new Date(room.last_message_at).getTime() : 0;

        const diff = lastMsgTime - lastReadTime;
        console.log(`Room ${room.id} (${room.type}): lastMsg=${room.last_message_at} (${lastMsgTime}), lastRead=${p.last_read_at} (${lastReadTime}), diffMs=${diff}`);
    });
}

compareMethods();
