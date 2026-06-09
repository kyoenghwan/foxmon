const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data, error } = await supabase
        .from('biz_ads')
        .select('*');
    if (error) {
        console.error("DB Error:", error);
        return;
    }
    console.log("Total Ads in DB:", data.length);
    data.forEach(ad => {
        console.log(`- ID: ${ad.id}`);
        console.log(`  Title: ${ad.title}`);
        console.log(`  Tier: ${ad.tier}`);
        console.log(`  Status: ${ad.status}`);
        console.log(`  ExpiresAt: ${ad.expires_at}`);
    });
}

run();
