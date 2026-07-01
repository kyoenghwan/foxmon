import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { supabaseAdmin } = require('../lib/supabase');

async function test() {
    const sql = `
        DELETE FROM point_policies WHERE config_key = 'ACTIVITY_POST_LIKE_RECEIVED';
        INSERT INTO point_policies (config_key, config_value, start_at, end_at)
        VALUES ('ACTIVITY_POST_LIKE_RECEIVED', 100, NOW(), '9999-12-31 23:59:59');
    `;

    console.log('Inserting ACTIVITY_POST_LIKE_RECEIVED via RPC...');
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success! Inserted ACTIVITY_POST_LIKE_RECEIVED successfully.', data);
    }
}

test();
