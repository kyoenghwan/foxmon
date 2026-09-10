const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    const ids = ['cfdd1fce-adfc-42b9-9093-7846e36f4a54', '872fa168-e834-4f7b-8a7e-e8c1c73955b0'];
    const { data: users } = await supabase.from('users').select('id, login_id, nickname, name, email').in('id', ids);
    console.log("Users matching IDs:", users);

    const { data: usersByLogin } = await supabase.from('users').select('id, login_id, nickname, name, email').eq('login_id', 'test1');
    console.log("Users matching login_id test1:", usersByLogin);
}

checkUsers();
