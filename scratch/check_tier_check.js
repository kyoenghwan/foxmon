const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Env 로딩
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// applyRollingLogic 복사
function applyRollingLogic(ads, count, customNowMs) {
    const nowMs = customNowMs || Date.now();
    const tenMinsMs = 10 * 60 * 1000;

    ads.sort((a, b) => {
        const timeA = new Date(a.created_at || a.last_exposed_at || 0).getTime();
        const timeB = new Date(b.created_at || b.last_exposed_at || 0).getTime();
        return timeB - timeA;
    });

    const newAds = [];
    const jumpAds = [];
    const oldAds = [];

    for (const ad of ads) {
        const adTime = new Date(ad.created_at || ad.last_exposed_at || 0).getTime();
        if (nowMs - adTime <= tenMinsMs) {
            newAds.push(ad);
        } else {
            if (ad.option_jump) {
                jumpAds.push(ad);
            } else {
                oldAds.push(ad);
            }
        }
    }

    const combinedGroup = [...jumpAds, ...oldAds];
    let rolledGroup = combinedGroup;

    if (combinedGroup.length > 0) {
        const currentMinute = Math.floor(nowMs / 60000);
        const offset = currentMinute % combinedGroup.length;
        rolledGroup = [...combinedGroup.slice(offset), ...combinedGroup.slice(0, offset)];
    }

    const baseSlots = [];
    for (const ad of rolledGroup) {
        baseSlots.push(ad);
        if (ad.option_double_slot) {
            baseSlots.push({ ...ad, id: ad.id + '_dup' });
        }
    }

    const anchors = [];
    for (const ad of newAds) {
        const adTime = new Date(ad.created_at || ad.last_exposed_at || 0).getTime();
        const ageMins = Math.floor((nowMs - adTime) / 60000);
        const targetIndex = Math.max(0, 9 - ageMins);
        anchors.push({ ad, targetIndex });
    }

    anchors.sort((a, b) => a.targetIndex - b.targetIndex);

    for (const anchor of anchors) {
        let i = anchor.targetIndex;
        while (i < baseSlots.length) {
            const current = baseSlots[i];
            const currentOriginalId = current?.id?.replace('_dup', '');
            if (current && current.option_double_slot) {
                while (i < baseSlots.length && baseSlots[i] && baseSlots[i].id.replace('_dup', '') === currentOriginalId) {
                    i++;
                }
            } else {
                break;
            }
        }
        baseSlots.splice(i, 0, anchor.ad);
        if (anchor.ad.option_double_slot) {
            baseSlots.splice(i + 1, 0, { ...anchor.ad, id: anchor.ad.id + '_dup' });
        }
    }

    return baseSlots.slice(0, count);
}

async function test() {
    console.log("⚡ getRotatedAds SIDE 8 테스트 시작...");
    
    // DB에서 데이터 직접 조회
    const { data: rawAds, error } = await supabase
        .from('biz_ads')
        .select('*')
        .eq('tier', 'SIDE');

    if (error || !rawAds || rawAds.length === 0) {
        console.log("❌ DB에 사이드 배너가 없거나 에러 발생");
        return;
    }

    // ACTIVE 필터링 적용
    const now = new Date();
    const activeRealAds = rawAds.filter((item) => {
        const isValidStatus = item.status === 'ACTIVE' || item.status === 'CLAIM_PENDING';
        if (!isValidStatus) return false;
        if (!item.expires_at) return true;
        const expireDate = new Date(item.expires_at);
        if (expireDate.getFullYear() === 2000) return false;
        return expireDate > now;
    });

    let ads = activeRealAds.map((item) => ({
        ...item,
        company: item.company || item.company_name || '업체명 없음',
        pay: item.pay || (item.salary_type ? `[${item.salary_type}] ${item.salary_amount}` : item.salary_amount) || '급여협의',
        image: item.image || item.logo_url || '',
        merchant_tier: 'NORMAL',
        isRealAd: true
    }));

    console.log(`- 쿼리된 실제 유효 광고 개수: ${ads.length}`);

    // 리팩토링한 로직 시뮬레이션
    const limitCount = 8;
    let rolledAds = applyRollingLogic(ads, ads.length);

    console.log(`- applyRollingLogic 결과 개수: ${rolledAds.length}`);

    if (rolledAds.length > 0 && rolledAds.length < limitCount) {
        const originalAds = [...rolledAds];
        while (rolledAds.length < limitCount) {
            rolledAds = [...rolledAds, ...originalAds.map(ad => ({
                ...ad,
                id: `${ad.id}_repeat_${rolledAds.length}`
            }))];
        }
        rolledAds = rolledAds.slice(0, limitCount);
    } else if (rolledAds.length === 0) {
        console.log("⚠️ rolledAds가 0입니다. 빈 배열 리턴");
        rolledAds = [];
    }

    console.log(`- 최종 리턴된 광고 개수: ${rolledAds.length}`);
    rolledAds.forEach((ad, i) => {
        console.log(`  [${i}] ID: ${ad.id}, Company: ${ad.company}`);
    });
}

test();
