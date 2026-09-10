const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoinStructure() {
    const rawUserId = '872fa168-e834-4f7b-8a7e-e8c1c73955b0';
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
        .eq('session_id', rawUserId);

    console.log("Raw participants result from Supabase:");
    participants.forEach((p, idx) => {
        console.log(`\nParticipant [${idx}]:`);
        console.log("  Is Array?", Array.isArray(p.foxtalk_rooms));
        console.log("  Value:", p.foxtalk_rooms);
    });
}

testJoinStructure();
