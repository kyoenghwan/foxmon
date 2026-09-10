import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kgwvftaebjkjwwpsftqv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIyNzAwMiwiZXhwIjoyMDg6ODAzMDAyfQ.xZ1N87rP...';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
    const { data, error } = await supabase.from('biz_ads').update({ expires_at: '2026-12-31T23:59:59.999Z', status: 'ACTIVE' }).eq('tier', 'SIDE').select('*');
    console.log('Error:', error);
    console.log('Data:', data?.length);
}
run();
