const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("=== Checking Users ===");
    const ids = [
        "b5e647ff-e8be-4502-ac30-06a2998cf7ef",
        "872fa168-e834-4f7b-8a7e-e8c1c73955b0",
        "86e6e27d-a3d0-4b68-a027-6bcb3ce7bdf4"
    ];
    
    for (const id of ids) {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, nickname, role, login_id')
            .eq('id', id)
            .single();
            
        if (error) {
            console.error(`User ${id} error:`, error);
        } else {
            console.log(`User ${id}:`, data);
        }
    }
}

run();
