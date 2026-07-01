import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { supabaseAdmin } = require('../lib/supabase');

async function test() {
    // get_func_def 함수를 execute_sql을 통해 생성했으므로, 이를 rpc로 호출해본다.
    // 만약 rpc 호출이 안 된다면 execute_sql 내부에서 SELECT결과를 가져올 다른 RPC를 정의해보자.
    // SELECT 결과를 jsonb로 반환하는 RPC를 추가한다.
    const createQueryJsonRpc = `
        CREATE OR REPLACE FUNCTION query_json(sql_query text) RETURNS jsonb AS $$
        DECLARE
            result jsonb;
        BEGIN
            EXECUTE 'SELECT json_agg(t) FROM (' || sql_query || ') t' INTO result;
            RETURN result;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    console.log('Creating query_json RPC...');
    const { data: createData, error: createError } = await supabaseAdmin.rpc('execute_sql', { sql: createQueryJsonRpc });
    if (createError) {
        console.error('Create Error:', createError);
        return;
    }
    console.log('Created query_json successfully.');

    // 이제 query_json을 사용해 정보 조회
    const checkPostTableSql = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'community_posts'
    `;
    const { data, error } = await supabaseAdmin.rpc('query_json', { sql_query: checkPostTableSql });
    if (error) {
        console.error('Query Error:', error);
    } else {
        console.log('Columns in community_posts:', data);
    }

    // community_comments 컬럼도 조회
    const checkCommentTableSql = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'community_comments'
    `;
    const { data: cData } = await supabaseAdmin.rpc('query_json', { sql_query: checkCommentTableSql });
    console.log('Columns in community_comments:', cData);
}

test();
