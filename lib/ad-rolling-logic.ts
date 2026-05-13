import { AdItem } from './ad-service';

export function applyRollingLogic(ads: AdItem[], count: number, customNowMs?: number): AdItem[] {
    const nowMs = customNowMs || Date.now();
    const tenMinsMs = 10 * 60 * 1000;

    ads.sort((a, b) => {
        const timeA = new Date(a.created_at || a.last_exposed_at || 0).getTime();
        const timeB = new Date(b.created_at || b.last_exposed_at || 0).getTime();
        return timeB - timeA;
    });

    const newAds: AdItem[] = [];
    const jumpAds: AdItem[] = [];
    const oldAds: AdItem[] = [];

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

    let rolledJumpAds = jumpAds;
    if (jumpAds.length > 0) {
        const currentMinute = Math.floor(nowMs / 60000);
        const offset = currentMinute % jumpAds.length;
        rolledJumpAds = [...jumpAds.slice(offset), ...jumpAds.slice(0, offset)];
    }

    let rolledOldAds = oldAds;
    if (oldAds.length > 0) {
        const currentMinute = Math.floor(nowMs / 60000);
        const offset = currentMinute % oldAds.length;
        rolledOldAds = [...oldAds.slice(offset), ...oldAds.slice(0, offset)];
    }

    const combinedBase = [...rolledJumpAds, ...rolledOldAds];

    const baseSlots: AdItem[] = [];
    for (const ad of combinedBase) {
        baseSlots.push(ad);
        if (ad.option_double_slot) {
            baseSlots.push({ ...ad, id: ad.id + '_dup' });
        }
    }

    const anchors: { ad: AdItem; targetIndex: number }[] = [];
    
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
