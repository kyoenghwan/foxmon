import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function test() {
    const { supabaseAdmin } = await import('../lib/supabase');
    const { getRotatedAds } = await import('../lib/ad-service');

    console.log("=== 1. DB biz_ads 직접 조회 ===");
    const { data, error } = await supabaseAdmin
        .from('biz_ads')
        .select('id, title, tier, status, expires_at, option_double_slot, option_double_slot_expires_at');
    
    console.log("DB biz_ads:", JSON.stringify(data, null, 2));

    console.log("=== 2. getRotatedAds('PREMIUM', 50) 실행 ===");
    const ads = await getRotatedAds('PREMIUM', 50);
    console.log("PREMIUM ads count:", ads.length);
    console.log("PREMIUM ads summary:", ads.map(a => ({ id: a.id, title: a.title, option_double_slot: a.option_double_slot, isRealAd: a.isRealAd })));
}

test().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
