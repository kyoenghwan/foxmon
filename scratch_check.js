require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
    const { data: user, error: uError } = await supabase.from('users').select('id, email, role, telegram_chat_id').eq('email', 'jw1566@naver.com').single();
    console.log("User:", user);
    
    const { data: ads } = await supabase.from('biz_ads').select('id, user_id, company_name').eq('user_id', user?.id || '');
    console.log("User Ads:", ads);
}
check();
