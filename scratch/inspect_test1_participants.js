const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTest1() {
    console.log("=== Users table matching test1 ===");
    const { data: users } = await supabase.from('users').select('*').or('login_id.eq.test1,nickname.eq.test1,nickname.eq.test');
    console.log(users);

    console.log("\n=== foxtalk_participants for test1 ===");
    const { data: parts } = await supabase.from('foxtalk_participants').select('*');
    if (users && users.length > 0) {
        const uIds = users.map(u => u.id);
        parts.filter(p => uIds.includes(p.session_id) || p.nickname === 'test1' || p.session_id === 'test1').forEach(p => {
            console.log(p);
        });
    }
}

checkTest1();
