import { supabaseAdmin } from './lib/supabase';

async function checkSchema() {
  const { data, error } = await supabaseAdmin.from('resumes').select('birth_year').limit(1);
  console.log('data:', data, 'error:', error);
}

checkSchema();
