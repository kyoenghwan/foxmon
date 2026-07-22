const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kgwvftaebjkjwwpsftqv.supabase.co';
// 기존 소스코드(check_db.js)에 노출된 개발용 anon key
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM';

const supabase = createClient(supabaseUrl, anonKey);

async function main() {
  const sql = `
    ALTER TABLE gift_card_requests ADD COLUMN IF NOT EXISTS pin_number TEXT;
    ALTER TABLE activity_point_transactions ADD COLUMN IF NOT EXISTS pin_number TEXT;
  `;

  console.log('⚡ Adding pin_number column to gift_card_requests and activity_point_transactions via execute_sql RPC...');
  const { data, error } = await supabase.rpc('execute_sql', { sql });

  if (error) {
    console.error('❌ RPC Error:', error);
  } else {
    console.log('✅ RPC Success! Columns added successfully.', data);
  }
}

main();
