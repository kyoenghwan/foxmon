const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testVariations() {
    const id1 = 'cfdd1fce-adfc-42b9-9093-7846e36f4a54';
    const id2 = '872fa168-e834-4f7b-8a7e-e8c1c73955b0';

    console.log("=== Testing ID 1 (cfdd1fce...): ===");
    const { data: p1 } = await supabase.from('foxtalk_participants').select('id, session_id').or(`session_id.eq.${id1}`);
    console.log("Participants count for ID1:", p1 ? p1.length : 0);

    console.log("=== Testing ID 2 (872fa168...): ===");
    const { data: p2 } = await supabase.from('foxtalk_participants').select('id, session_id').or(`session_id.eq.${id2}`);
    console.log("Participants count for ID2:", p2 ? p2.length : 0);
}

testVariations();
