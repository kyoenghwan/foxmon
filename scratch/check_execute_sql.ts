import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const { supabaseAdmin } = require('../lib/supabase');

async function test() {
    // execute_sql RPC definition 조회
    const sql = `
        SELECT routine_definition 
        FROM information_schema.routines 
        WHERE routine_name = 'execute_sql';
    `;
    // select 결과를 임시 테이블에 적고 이를 json 형태로 조회하거나 하는 트릭
    const tempSql = `
        CREATE TEMP TABLE temp_tables AS
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
    `;
    
    // execute_sql 이 SELECT 쿼리를 받으면 결과를 어떻게 리턴하는지 알아보기 위해
    // execute_sql을 사용해 임시 테이블을 만들고 copy나 insert 후 select하는 방법 시도
    // 또는 그냥 psql이나 pg_catalog를 통해 execute_sql 함수의 소스코드 검색
    console.log('Querying execute_sql source...');
    // execute_sql RPC를 호출하는 것 대신, 직접 쿼리를 할 수 있는 방법이 없는지 확인
    // supabaseAdmin.rpc('execute_sql', { sql: 'SELECT ...' })가 리턴값이 OK만 주는 것은 
    // 리턴 타입이 void이거나 단순 text로 성공여부만 주기 때문임.
    
    // 만약 리턴타입이 void라면 SELECT 쿼리를 바로 실행하여 결과를 얻을 수 없다.
    // 그렇다면 execute_sql RPC의 실제 정의를 변경하거나, 새로운 RPC를 추가하자.
    // 우선 execute_sql의 소스코드를 얻는 SQL을 실행해보자.
    const getFuncSql = `
        CREATE OR REPLACE FUNCTION get_func_def() RETURNS text AS $$
        DECLARE
            def text;
        BEGIN
            SELECT prosrc INTO def FROM pg_proc WHERE proname = 'execute_sql';
            RETURN def;
        END;
        $$ LANGUAGE plpgsql;
    `;
    await supabaseAdmin.rpc('execute_sql', { sql: getFuncSql });
    // 이제 실행 가능
}
test();
