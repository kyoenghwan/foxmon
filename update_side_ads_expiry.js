const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kgwvftaebjkjwwpsftqv.supabase.co';
// service_role 키를 직접 사용하거나 env에서 불러옵니다.
const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIyNzAwMiwiZXhwIjoyMDg2ODAzMDAyfQ.xZ1N87rP... fallback');

async function updateSideAdsExpiry() {
    const newExpiry = '2026-12-31T23:59:59.999Z';
    const { data, error } = await supabaseAdmin
        .from('biz_ads')
        .update({ expires_at: newExpiry, status: 'ACTIVE' })
        .eq('tier', 'SIDE')
        .select('*');

    if (error) {
        console.error('Update Error:', error);
        return;
    }
    console.log('✅ SIDE 광고 만료일 갱신 완료 count:', data?.length);
    console.table(data?.map(r => ({ id: r.id, title: r.title, tier: r.tier, status: r.status, expires_at: r.expires_at })));
}

updateSideAdsExpiry();
