const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("=== Fetching all canvas ads from jobs ===");
    const { data, error } = await supabase.from('jobs').select('id, title, detail_content, design_mode');
    if (error) {
        console.error("Error fetching jobs:", error);
    } else {
        data.forEach(ad => {
            if (ad.detail_content && (ad.detail_content.includes('isCanvas') || ad.detail_content.startsWith('{'))) {
                console.log(`[JOBS] ID: ${ad.id}, Title: ${ad.title}, Design Mode: ${ad.design_mode}`);
                console.log(`Content starts with: ${ad.detail_content.substring(0, 150)}`);
                console.log('--------------------------------------------------');
            }
        });
    }

    console.log("=== Fetching all canvas ads from biz_ads ===");
    const { data: data2, error: error2 } = await supabase.from('biz_ads').select('id, title, detail_content, design_mode');
    if (error2) {
        console.error("Error fetching biz_ads:", error2);
    } else {
        data2.forEach(ad => {
            if (ad.detail_content && (ad.detail_content.includes('isCanvas') || ad.detail_content.startsWith('{'))) {
                console.log(`[BIZ_ADS] ID: ${ad.id}, Title: ${ad.title}, Design Mode: ${ad.design_mode}`);
                console.log(`Content starts with: ${ad.detail_content.substring(0, 150)}`);
                console.log('--------------------------------------------------');
            }
        });
    }
}

run();
