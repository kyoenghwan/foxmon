const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNextAuthUsers() {
    console.log("=== All users in users table ===");
    const { data: users } = await supabase.from('users').select('id, login_id, nickname, name');
    console.log(users);
}

checkNextAuthUsers();
