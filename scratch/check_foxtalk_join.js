const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    console.log("=== Checking foxtalk_rooms JOIN ===");
    const { data: rooms, error: roomsError } = await supabase
        .from('foxtalk_rooms')
        .select(`
            *,
            employer:employer_id(id, login_id, nickname, name, business_name),
            seeker:seeker_id(id, login_id, nickname, name)
        `)
        .eq('type', '1ON1')
        .limit(5);
        
    if (roomsError) {
        console.error("foxtalk_rooms JOIN error:", roomsError);
    } else {
        console.log("foxtalk_rooms JOIN samples:", JSON.stringify(rooms, null, 2));
    }
}

run();
