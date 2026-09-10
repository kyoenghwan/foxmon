const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealtime() {
    console.log("Testing realtime channel connection...");
    const channel = supabase.channel('test-channel');
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'foxtalk_messages' }, (status) => {
        console.log("Event status:", status);
    }).subscribe((status) => {
        console.log("Channel subscription status:", status);
        process.exit(0);
    });
}

checkRealtime();
