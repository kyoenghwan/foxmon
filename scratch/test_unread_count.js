const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilterUnread() {
    const rawUserId = '872fa168-e834-4f7b-8a7e-e8c1c73955b0';
    const normalizedUserId = rawUserId.toLowerCase();

    console.log("=== 1. Without filtering CS rooms ===");
    const { data: allParts } = await supabase
        .from('foxtalk_participants')
        .select('id, room_id, last_read_at, foxtalk_rooms!inner(type)')
        .or(`session_id.eq.${rawUserId},session_id.eq.${normalizedUserId}`);

    console.log("All Participants count:", allParts ? allParts.length : 0);
    if (allParts) {
        for (const p of allParts) {
            const lastReadAt = p.last_read_at || '1970-01-01T00:00:00.000Z';
            const { count } = await supabase
                .from('foxtalk_messages')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', p.room_id)
                .neq('participant_id', p.id)
                .gt('created_at', lastReadAt);
            console.log(`  Room ${p.room_id} (Type: ${p.foxtalk_rooms.type}) -> Unread count: ${count}`);
        }
    }

    console.log("\n=== 2. With filtering OUT CS rooms (.neq('foxtalk_rooms.type', 'CS')) ===");
    const { data: foxParts } = await supabase
        .from('foxtalk_participants')
        .select('id, room_id, last_read_at, foxtalk_rooms!inner(type)')
        .or(`session_id.eq.${rawUserId},session_id.eq.${normalizedUserId}`)
        .neq('foxtalk_rooms.type', 'CS');

    console.log("FoxTalk-only Participants count:", foxParts ? foxParts.length : 0);
    let totalUnread = 0;
    if (foxParts) {
        for (const p of foxParts) {
            const lastReadAt = p.last_read_at || '1970-01-01T00:00:00.000Z';
            const { count } = await supabase
                .from('foxtalk_messages')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', p.room_id)
                .neq('participant_id', p.id)
                .gt('created_at', lastReadAt);
            const isUnread = (count && count > 0) ? 1 : 0;
            totalUnread += isUnread;
            console.log(`  Room ${p.room_id} (Type: ${p.foxtalk_rooms.type}) -> Unread count: ${count} (isUnread: ${isUnread})`);
        }
    }
    console.log(`\nFinal FoxTalk Total Unread Count: ${totalUnread}`);
}

testFilterUnread();
