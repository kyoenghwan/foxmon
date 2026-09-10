import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../lib/supabase';

async function main() {
    console.log('🔄 광고와 연동된 구인글의 만료일(expires_at) 동기화 시작...');
    const { data: ads, error: adsErr } = await supabaseAdmin
        .from('biz_ads')
        .select('id, expires_at, status');

    if (adsErr) {
        console.error('Error fetching biz_ads:', adsErr);
        return;
    }

    let updatedCount = 0;
    for (const ad of ads || []) {
        if (!ad.expires_at) continue;
        const { error: jobErr } = await supabaseAdmin
            .from('jobs')
            .update({
                expires_at: ad.expires_at,
                status: ad.status,
                updated_at: new Date().toISOString()
            })
            .eq('linked_ad_id', ad.id);

        if (!jobErr) {
            updatedCount++;
        }
    }

    console.log(`✅ 총 ${updatedCount}개의 연동 구인글 만료일 동기화 완료!`);
}

main().catch(console.error);
