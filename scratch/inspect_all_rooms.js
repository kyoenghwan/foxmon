const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAllRooms() {
    const { data: rooms } = await supabase.from('foxtalk_rooms').select('*');
    console.log("All Rooms:");
    rooms.forEach(r => {
        console.log(`ID: ${r.id}, Type: ${r.type}, Title: ${r.title}, Employer: ${r.employer_id}, Seeker: ${r.seeker_id}, CreatedBy: ${r.created_by}`);
    });
}

inspectAllRooms();
