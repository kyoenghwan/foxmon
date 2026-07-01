import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { supabaseAdmin } = require('../lib/supabase');

async function main() {
    const migrationPath = 'supabase/migrations/20260701000000_community_likes_and_streaks.sql';
    console.log('Reading migration file...');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration SQL on remote database via RPC execute_sql...');
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });

    if (error) {
        console.error('Migration execution failed:', error);
    } else {
        console.log('Migration executed successfully! Result:', data);
    }
}

main();
