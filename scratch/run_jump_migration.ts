import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { supabaseAdmin } = require('../lib/supabase');

async function runMigration() {
    console.log('Starting Auto-Jump Schema Migration...');

    const ddlQuery = `
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS jump_interval INTEGER DEFAULT 4;
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_jumped_at TIMESTAMP WITH TIME ZONE DEFAULT now();

        ALTER TABLE biz_ads ADD COLUMN IF NOT EXISTS jump_interval INTEGER DEFAULT 4;
        ALTER TABLE biz_ads ADD COLUMN IF NOT EXISTS last_jumped_at TIMESTAMP WITH TIME ZONE DEFAULT now();

        UPDATE jobs SET last_jumped_at = COALESCE(last_exposed_at, created_at, now()) WHERE last_jumped_at IS NULL;
        UPDATE biz_ads SET last_jumped_at = COALESCE(last_exposed_at, created_at, now()) WHERE last_jumped_at IS NULL;
    `;

    console.log('Executing DDL...');
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql: ddlQuery });
    if (error) {
        console.error('Migration Failed:', error);
    } else {
        console.log('Migration Completed Successfully!', data);
    }
}

runMigration();
