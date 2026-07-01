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

async function run() {
    const { data: rooms, error } = await supabase.rpc('execute_sql', {
        sql: `SELECT id, type, title, employer_id, seeker_id FROM foxtalk_rooms;`
    });
    console.log('ROOMS:', rooms);

    const { data: messages } = await supabase.rpc('execute_sql', {
        sql: `
            SELECT m.id, m.room_id, m.content, p.nickname, r.title, r.type
            FROM foxtalk_messages m
            LEFT JOIN foxtalk_participants p ON m.participant_id = p.id
            LEFT JOIN foxtalk_rooms r ON m.room_id = r.id
            ORDER BY m.created_at ASC;
        `
    });
    console.log('MESSAGES:', messages);
}
run();
