const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
});

if (!key) {
    const envFile2 = fs.readFileSync('.env', 'utf8');
    envFile2.split('\n').forEach(line => {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
    });
}

const supabase = createClient(url, key);

async function checkIndex() {
    const sql = `
        SELECT
            tablename,
            indexname,
            indexdef
        FROM
            pg_indexes
        WHERE
            schemaname = 'public'
            AND tablename = 'foxtalk_messages';
    `;
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
        console.error('Error executing sql:', error);
        return;
    }
    console.log('Indexes for foxtalk_messages:');
    console.log(JSON.stringify(data, null, 2));

    const countSql = `SELECT count(*) FROM foxtalk_messages;`;
    const { data: countData, error: countErr } = await supabase.rpc('execute_sql', { sql: countSql });
    if (countErr) {
        console.error('Error counting messages:', countErr);
    } else {
        console.log('Total messages count:', countData);
    }
}

checkIndex();
