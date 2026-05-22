const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("=== Checking biz_ads ===");
    const { data: bizAds, error: bizError } = await supabase.from('biz_ads').select('tier');
    if (bizError) {
        console.error("biz_ads error:", bizError);
    } else {
        console.log("biz_ads count:", bizAds.length);
        const tiers = {};
        bizAds.forEach(ad => {
            tiers[ad.tier] = (tiers[ad.tier] || 0) + 1;
        });
        console.log("biz_ads tiers:", tiers);
    }

    console.log("\n=== Checking jobs ===");
    const { data: jobs, error: jobsError } = await supabase.from('jobs').select('tier');
    if (jobsError) {
        console.error("jobs error:", jobsError);
    } else {
        console.log("jobs count:", jobs.length);
        const tiers = {};
        jobs.forEach(ad => {
            tiers[ad.tier] = (tiers[ad.tier] || 0) + 1;
        });
        console.log("jobs tiers:", tiers);
    }
}

run();
