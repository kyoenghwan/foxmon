const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', url);
console.log('KEY EXISTS:', !!key);

if (!url || !key) {
  console.log('Missing env variables. Checking .env...');
  require('dotenv').config({ path: '.env' });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fix() {
  const { data, error } = await supabase
    .from('biz_ads')
    .update({ 
      expires_at: '2026-12-31T23:59:59.999Z', 
      status: 'ACTIVE' 
    })
    .eq('tier', 'SIDE')
    .select('id, title, tier, status, expires_at');

  if (error) {
    console.error('Update Error:', error);
    return;
  }

  console.log('✅ Successfully updated SIDE ads count:', data?.length);
  console.table(data);
}

fix();
