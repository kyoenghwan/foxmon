import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { supabaseAdmin } = require('../lib/supabase');

async function main() {
    const sql = `
        ALTER TABLE gift_card_requests ADD COLUMN IF NOT EXISTS pin_number TEXT;
    `;

    console.log('Adding pin_number column to gift_card_requests via RPC...');
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success! pin_number column added successfully.', data);
    }
}

main();
