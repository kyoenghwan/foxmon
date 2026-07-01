import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { supabaseAdmin } = require('../lib/supabase');

async function test() {
    // community_posts 및 community_comments 테이블의 컬럼 확인
    // 공물(likes) 테이블이 이미 있는지 조회
    const sql = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name LIKE '%community%' OR table_name LIKE '%like%';
    `;

    console.log('Querying tables...');
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success! Tables:', data);
    }
}

test();
