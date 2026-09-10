const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCb22() {
    const roomId = 'cb22fe2c-0403-4ba4-9604-7e8f2274aff1';
    console.log("=== Room cb22fe2c participants ===");
    const { data: parts } = await supabase.from('foxtalk_participants').select('*').eq('room_id', roomId);
    console.log(parts);

    console.log("\n=== Room cb22fe2c messages ===");
    const { data: msgs } = await supabase.from('foxtalk_messages').select('*').eq('room_id', roomId);
    console.log(msgs);
}

checkCb22();
