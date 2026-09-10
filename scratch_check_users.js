require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, login_id, name, phone_number, ci, created_at')
    .or('name.ilike.%민경환%,login_id.ilike.%TEST%,login_id.ilike.%kyoen%');

  if (error) {
    console.error(error);
    return;
  }
  console.log('--- DB 조회 결과 ---');
  console.table(data);
}

checkUsers();
