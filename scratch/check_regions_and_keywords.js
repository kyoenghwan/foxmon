const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data: region1 } = await supabase.from('common_codes').select('*').eq('list_type', 'JOB_REGION_1');
    const { data: region2 } = await supabase.from('common_codes').select('*').eq('list_type', 'JOB_REGION_2');
    const { data: keywords } = await supabase.from('common_codes').select('*').eq('list_type', 'KEYWORD');

    console.log("JOB_REGION_1 count:", region1?.length);
    console.log("JOB_REGION_1 examples:", region1?.slice(0, 5));
    console.log("JOB_REGION_2 count:", region2?.length);
    console.log("JOB_REGION_2 examples:", region2?.slice(0, 5));
    console.log("KEYWORD count:", keywords?.length);
    console.log("KEYWORD examples:", keywords?.slice(0, 20));
}

run();
