const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3Zmd&key=anon"; // wait, let's copy actual anon key
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, anonKey);

async function run() {
    const { data: codes, error } = await supabase
        .from('common_codes')
        .select('list_type, code_value, parent_code_value, code_name')
        .limit(20);
    console.log("Error:", error);
    console.log("Codes preview:", codes);

    const { data: types, error: typesError } = await supabase
        .from('common_codes')
        .select('list_type');
    if (types) {
        const uniqueTypes = [...new Set(types.map(t => t.list_type))];
        console.log("Unique list_types:", uniqueTypes);
    }
}

run();
