const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgwvftaebjkjwwpsftqv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM');

// supabase-js v2 rpc or direct query is not possible unless we have postgres connection string or an rpc function.
// But we can check if there's an RPC.
async function alter() {
    const { data, error } = await supabase.rpc('execute_sql', { sql: "ALTER TABLE jobs ADD COLUMN premium_banner_mode text;" });
    console.log(error || data);
}
alter();
