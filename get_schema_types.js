const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(url, key);

async function getColumnTypes() {
    // Attempting to read information_schema is usually blocked for anon keys. 
    // We can just query 1 row and infer basic types, or just fallback to TEXT for everything.
    // Wait, if it's blocked, we can't create an exact replica. Let's try RPC if any, or just fetch 1 row.
    const { data, error } = await supabase.from('jobs').select('*').limit(1);
    
    if (error) {
        console.error("Error fetching jobs:", error);
        return;
    }
    
    // We don't have types. We might have to guess them or ask the user to clone the table in Supabase dashboard.
    console.log("To duplicate the table perfectly, you can run in Supabase SQL Editor:");
    console.log("CREATE TABLE biz_ads (LIKE jobs INCLUDING ALL);");
}
getColumnTypes();
