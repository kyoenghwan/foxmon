require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is missing in env!');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const sql = `
        CREATE TABLE IF NOT EXISTS public.cs_approved_devices (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            device_token VARCHAR(255) UNIQUE NOT NULL,
            device_name VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- RLS 활성화 및 관리자 권한 제어
        ALTER TABLE public.cs_approved_devices ENABLE ROW LEVEL SECURITY;

        -- 정책이 이미 있는지 확인 후 생성
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE tablename = 'cs_approved_devices' 
                  AND policyname = '관리자는 모든 기기 데이터를 관리할 수 있음'
            ) THEN
                CREATE POLICY "관리자는 모든 기기 데이터를 관리할 수 있음"
                    ON public.cs_approved_devices FOR ALL
                    USING (
                        EXISTS (
                            SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'SUPER_ADMIN')
                        )
                    );
            END IF;
        END
        $$;
    `;

    console.log('⚡ Creating cs_approved_devices table in Supabase...');
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql });

    if (error) {
        console.error('❌ Error executing SQL:', error);
    } else {
        console.log('✅ Success! Created cs_approved_devices table and policy.', data);
    }
}

main();
