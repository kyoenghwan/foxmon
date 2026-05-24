const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("=== Fetching one row from jobs ===");
    const { data, error } = await supabase.from('jobs').select('*').limit(1);
    if (error) {
        console.error("Error fetching jobs:", error);
    } else {
        console.log("Jobs row fields:", Object.keys(data[0] || {}));
        console.log("Jobs raw data:", data[0]);
    }
}

run();
