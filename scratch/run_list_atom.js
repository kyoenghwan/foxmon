const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: users } = await supabase.from('users').select('id, login_id');
  const { data: jobs } = await supabase.from('jobs').select('id, user_id, title');

  console.log("=== Users ===");
  users.forEach(u => console.log(`User: ${u.login_id} (ID: ${u.id})`));

  console.log("=== Jobs ===");
  jobs.forEach(j => {
    console.log(`Job: ${j.title} (user_id: ${j.user_id})`);
    const match = users.find(u => u.id === j.user_id);
    console.log(` -> Match found? ${match ? match.login_id : 'No'}`);
  });
}

check();
