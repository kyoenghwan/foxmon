const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUnpaidAds() {
    try {
        console.log('🔍 결제되지 않았으나 ACTIVE 상태인 광고를 조회합니다...');
        
        const { data: ads, error } = await supabase
            .from('biz_ads')
            .select('id, title, status, expires_at, total_points, created_at')
            .eq('status', 'ACTIVE');
            
        if (error) throw error;
        
        console.log(`전체 ACTIVE 광고 개수: ${ads.length}개`);
        
        const targets = ads.filter(ad => {
            const points = ad.total_points || 0;
            const expiresYear = ad.expires_at ? new Date(ad.expires_at).getFullYear() : 2000;
            
            // 만료일이 2000년이거나, 결제 포인트가 0인 경우 미결제 광고로 분류
            return points === 0 || expiresYear === 2000;
        });
        
        console.log(`교정 대상 미결제 광고 개수: ${targets.length}개`);
        
        if (targets.length === 0) {
            console.log('✅ 교정할 광고가 없습니다.');
            return;
        }
        
        for (const ad of targets) {
            console.log(`➡️ 교정 대상: [ID: ${ad.id}] "${ad.title}" (포인트: ${ad.total_points}P, 만료일: ${ad.expires_at})`);
            
            const { error: updateError } = await supabase
                .from('biz_ads')
                .update({ 
                    status: 'PAUSED',
                    expires_at: '2000-01-01T00:00:00.000+09:00'
                })
                .eq('id', ad.id);
                
            if (updateError) {
                console.error(`❌ [ID: ${ad.id}] 업데이트 실패:`, updateError.message);
            } else {
                console.log(`✅ [ID: ${ad.id}] PAUSED 및 만료일 잠금 완료.`);
            }
        }
        
        console.log('🎉 모든 교정 작업이 완료되었습니다.');
        
    } catch (error) {
        console.error('에러 발생:', error);
    }
}

fixUnpaidAds();
