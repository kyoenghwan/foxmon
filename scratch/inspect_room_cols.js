const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRoomCols() {
    const { data, error } = await supabase.from('foxtalk_rooms').select('*').limit(1);
    if (data && data[0]) {
        console.log("foxtalk_rooms columns:", Object.keys(data[0]));
    } else {
        console.error("Error or no data:", error);
    }
}

inspectRoomCols();
