const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
    console.log("Running Auto-Jump Schema Migration on Supabase Cloud via execute_sql RPC...");

    const ddlQuery = `
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS jump_interval INTEGER DEFAULT 4;
        ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_jumped_at TIMESTAMP WITH TIME ZONE DEFAULT now();

        ALTER TABLE biz_ads ADD COLUMN IF NOT EXISTS jump_interval INTEGER DEFAULT 4;
        ALTER TABLE biz_ads ADD COLUMN IF NOT EXISTS last_jumped_at TIMESTAMP WITH TIME ZONE DEFAULT now();

        UPDATE jobs SET last_jumped_at = COALESCE(last_exposed_at, created_at, now()) WHERE last_jumped_at IS NULL;
        UPDATE biz_ads SET last_jumped_at = COALESCE(last_exposed_at, created_at, now()) WHERE last_jumped_at IS NULL;
    `;

    const { data, error } = await supabase.rpc('execute_sql', { sql: ddlQuery });
    if (error) {
        console.error("❌ Migration Failed. Error:", error.message);
    } else {
        console.log("✅ Migration Completed Successfully! Result:", data);
    }
}

runMigration();
