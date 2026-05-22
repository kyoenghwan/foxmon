const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data: ads } = await supabase.from('biz_ads').select('id, title, location').limit(10);
    const { data: jobs } = await supabase.from('jobs').select('id, title, location').limit(10);

    console.log("Biz Ads locations:");
    ads?.forEach(a => console.log(`- ${a.title} -> ${a.location}`));
    console.log("Jobs locations:");
    jobs?.forEach(j => console.log(`- ${j.title} -> ${j.location}`));
}

run();
