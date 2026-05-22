const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data, error } = await supabase.from('biz_ads').select('*').limit(1);
    if (error) {
        console.error(error);
    } else {
        const keys = Object.keys(data[0]);
        console.log("Keys containing 'time' or 'date' or 'created' or 'exposed':", keys.filter(k => k.includes('time') || k.includes('date') || k.includes('created') || k.includes('exposed') || k.includes('at')));
        console.log("All keys:", keys.join(', '));
    }
}

run();
