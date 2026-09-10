const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserTalk() {
    console.log("=== Checking Participants for test1 ===");
    const { data: parts, error: partErr } = await supabase
        .from('foxtalk_participants')
        .select('*');

    if (partErr) {
        console.error("Error:", partErr);
        return;
    }

    console.log(`Total participants: ${parts.length}`);
    parts.forEach(p => {
        console.log(`RoomID: ${p.room_id}, SessionID: ${p.session_id}, Nickname: ${p.nickname}, LastReadAt: ${p.last_read_at}`);
    });

    console.log("\n=== Checking Rooms Details ===");
    const { data: rooms } = await supabase
        .from('foxtalk_rooms')
        .select('*');
    
    for (const r of rooms) {
        const { data: msgs } = await supabase
            .from('foxtalk_messages')
            .select('*')
            .eq('room_id', r.id)
            .order('created_at', { ascending: false });

        console.log(`\nRoom ${r.id} (${r.type}) - Total Msgs: ${msgs ? msgs.length : 0}, LastMsgAt: ${r.last_message_at}`);
        if (msgs && msgs.length > 0) {
            console.log(`  Latest Msg: "${msgs[0].content}" at ${msgs[0].created_at}`);
        }
    }
}

checkUserTalk();
