const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLastMsg() {
    const roomId = 'cb22fe2c-0403-4ba4-9604-7e8f2274aff1';
    const { data: room } = await supabase.from('foxtalk_rooms').select('*').eq('id', roomId).single();
    console.log("Room cb22fe2c details:", room);
}

checkLastMsg();
