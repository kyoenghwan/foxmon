const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// adCache 모방
const adCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

async function fetchAdsFromDB(tier) {
    const targetTable = tier === 'GENERAL' ? 'jobs' : 'biz_ads';
    const nowStr = new Date().toISOString();
    let queryBuilder;
    if (targetTable === 'jobs') {
        queryBuilder = supabase
            .from('jobs')
            .select('id, tier, expires_at, status')
            .eq('tier', tier)
            .in('status', ['ACTIVE', 'CLAIM_PENDING'])
            .or(`expires_at.is.null,expires_at.gt.${nowStr}`);
    } else {
        queryBuilder = supabase
            .from('biz_ads')
            .select('id, tier, expires_at, status')
            .eq('tier', tier)
            .in('status', ['ACTIVE', 'CLAIM_PENDING'])
            .or(`expires_at.is.null,expires_at.gt.${nowStr}`);
    }
    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data || [];
}

async function getRotatedAds(tier) {
    const now = Date.now();
    if (!adCache[tier]) {
        adCache[tier] = { ads: [], lastFetched: 0, isFetching: false };
    }
    const cache = adCache[tier];
    if (now - cache.lastFetched > CACHE_TTL_MS) {
        if (!cache.isFetching) {
            cache.isFetching = true;
            try {
                const ads = await fetchAdsFromDB(tier);
                cache.ads = ads;
                cache.lastFetched = Date.now();
            } finally {
                cache.isFetching = false;
            }
        }
    }
    return cache.ads;
}

async function testAll() {
    const tiers = ['SIDE', 'PREMIUM_MAIN', 'PREMIUM', 'SPECIAL', 'AD_GENERAL', 'GENERAL'];
    const start = performance.now();
    await Promise.all(tiers.map(t => getRotatedAds(t)));
    console.log(`Fetch completed in ${(performance.now() - start).toFixed(2)}ms`);
}

async function run() {
    console.log('--- 1st Fetch (Cache Miss) ---');
    await testAll();
    
    console.log('\n--- 2nd Fetch (Cache Hit) ---');
    await testAll();

    console.log('\n--- 3rd Fetch (Cache Hit) ---');
    await testAll();
}

run();
