const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testMatching() {
    const userId = 'cfdd1fce-adfc-42b9-9093-7846e36f4a54'; // user.id for test1

    console.log("=== 1. Rooms where user is employer_id or seeker_id or created_by ===");
    const { data: userRooms } = await supabase
        .from('foxtalk_rooms')
        .select('id, type, employer_id, seeker_id, created_by')
        .or(`employer_id.eq.${userId},seeker_id.eq.${userId},created_by.eq.${userId}`);

    console.log("Found rooms:", userRooms);

    const roomIds = (userRooms || []).map(r => r.id);

    console.log("\n=== 2. Participants in those rooms OR session_id ===");
    const { data: participants } = await supabase
        .from('foxtalk_participants')
        .select('id, room_id, session_id, last_read_at, foxtalk_rooms!inner(type)')
        .or(`session_id.eq.${userId},room_id.in.(${roomIds.join(',')})`);

    console.log("Participants found:", participants);
}

testMatching();
