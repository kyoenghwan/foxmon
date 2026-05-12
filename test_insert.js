const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMjcwMDIsImV4cCI6MjA4NjgwMzAwMn0.Q975SBTteQVLrP_Cny2u_nzQyBd-jRIeGtf9dAlGyEM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data, error } = await supabase
        .from('community_posts')
        .insert({
            board_id: 'event',
            user_id: '20c75c83-5095-46f0-a15f-55cc2ed26f78', // some dummy UUID
            author_name: 'Admin',
            is_anonymous: false,
            title: 'Test Event',
            content: 'Test content',
        })
        .select()
        .single();
    
    console.log("Error:", error);
    console.log("Data:", data);
}

run();
