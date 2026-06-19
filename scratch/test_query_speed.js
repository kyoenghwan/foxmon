const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Supabase URL or Anon Key is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing connection speed to Supabase...');
  console.log('URL:', supabaseUrl);

  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    try {
      const { data, error } = await supabase
        .from('users')
        .select('nickname')
        .limit(1);
      
      const elapsed = Date.now() - start;
      if (error) {
        console.log(`[Attempt ${i+1}] Error: ${error.message} (Took ${elapsed}ms)`);
      } else {
        console.log(`[Attempt ${i+1}] Success! (Took ${elapsed}ms)`);
      }
    } catch (e) {
      console.log(`[Attempt ${i+1}] Exception: ${e.message} (Took ${Date.now() - start}ms)`);
    }
  }
}

test();
