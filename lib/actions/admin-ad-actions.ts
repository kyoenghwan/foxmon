'use server';

import { supabaseAdmin } from '../supabase';
import { revalidatePath } from 'next/cache';
import { invalidateAdCache } from '../ad-service';

/**
 * 1차 삭제 (소프트 삭제 - 휴지통 이동)
 * status = 'DELETED', updated_at = 현재시각
 */
export async function adminSoftDeleteAdAction(id: string, isJob: boolean = false) {
    try {
        const now = new Date().toISOString();
        await supabaseAdmin.from('jobs').update({ status: 'DELETED', updated_at: now }).eq('id', id);
        await supabaseAdmin.from('jobs').update({ status: 'DELETED', updated_at: now }).eq('linked_ad_id', id);
        await supabaseAdmin.from('biz_ads').update({ status: 'DELETED', updated_at: now }).eq('id', id);
        await supabaseAdmin.from('biz_ads').update({ status: 'DELETED', updated_at: now }).eq('linked_ad_id', id);

        await invalidateAdCache();
        revalidatePath('/', 'layout');
        revalidatePath('/fox-office/ad-rankings', 'page');
        revalidatePath('/fox-office/jobs', 'page');
        return { success: true, message: '1차 삭제(휴지통 이동) 되었습니다. (30일 후 자동/수동 완전 삭제 가능)' };
    } catch (error: any) {
        console.error('adminSoftDeleteAdAction error:', error);
        return { success: false, message: error.message || '1차 삭제 도중 오류가 발생했습니다.' };
    }
}

/**
 * 2차 완전 삭제 (영구 물리 삭제)
 */
export async function adminHardDeleteAdAction(id: string, isJob: boolean = false) {
    try {
        await supabaseAdmin.from('jobs').delete().eq('id', id);
        await supabaseAdmin.from('jobs').delete().eq('linked_ad_id', id);
        await supabaseAdmin.from('biz_ads').delete().eq('id', id);
        await supabaseAdmin.from('biz_ads').delete().eq('linked_ad_id', id);

        await invalidateAdCache();
        revalidatePath('/', 'layout');
        revalidatePath('/fox-office/ad-rankings', 'page');
        revalidatePath('/fox-office/jobs', 'page');
        return { success: true, message: '영구 완전 삭제되었습니다.' };
    } catch (error: any) {
        console.error('adminHardDeleteAdAction error:', error);
        return { success: false, message: error.message || '영구 삭제 도중 오류가 발생했습니다.' };
    }
}

/**
 * 1차 삭제 항목 복구 (status = 'ACTIVE')
 */
export async function adminRestoreAdAction(id: string, isJob: boolean = false) {
    try {
        const now = new Date().toISOString();
        await supabaseAdmin.from('jobs').update({ status: 'ACTIVE', updated_at: now }).eq('id', id);
        await supabaseAdmin.from('jobs').update({ status: 'ACTIVE', updated_at: now }).eq('linked_ad_id', id);
        await supabaseAdmin.from('biz_ads').update({ status: 'ACTIVE', updated_at: now }).eq('id', id);
        await supabaseAdmin.from('biz_ads').update({ status: 'ACTIVE', updated_at: now }).eq('linked_ad_id', id);

        await invalidateAdCache();
        revalidatePath('/', 'layout');
        revalidatePath('/fox-office/ad-rankings', 'page');
        revalidatePath('/fox-office/jobs', 'page');
        return { success: true, message: '성공적으로 복구(ACTIVE)되었습니다.' };
    } catch (error: any) {
        console.error('adminRestoreAdAction error:', error);
        return { success: false, message: error.message || '복구 도중 오류가 발생했습니다.' };
    }
}

/**
 * 1차 삭제 후 30일 경과 항목 일괄 2차 영구 삭제
 */
export async function adminPurgeOldDeletedAdsAction() {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: oldAds } = await supabaseAdmin
            .from('biz_ads')
            .select('id')
            .eq('status', 'DELETED')
            .lt('updated_at', thirtyDaysAgo);

        if (oldAds && oldAds.length > 0) {
            const ids = oldAds.map(a => a.id);
            await supabaseAdmin.from('jobs').delete().in('linked_ad_id', ids);
            await supabaseAdmin.from('biz_ads').delete().in('id', ids);
        }

        const { data: oldJobs } = await supabaseAdmin
            .from('jobs')
            .select('id')
            .eq('status', 'DELETED')
            .is('linked_ad_id', null)
            .lt('updated_at', thirtyDaysAgo);

        if (oldJobs && oldJobs.length > 0) {
            const jIds = oldJobs.map(j => j.id);
            await supabaseAdmin.from('jobs').delete().in('id', jIds);
        }

        const totalPurged = (oldAds?.length || 0) + (oldJobs?.length || 0);

        await invalidateAdCache();
        revalidatePath('/', 'layout');
        revalidatePath('/fox-office/ad-rankings', 'page');
        revalidatePath('/fox-office/jobs', 'page');

        return { success: true, message: `30일이 경과한 ${totalPurged}건의 항목이 영구 삭제되었습니다.` };
    } catch (error: any) {
        console.error('adminPurgeOldDeletedAdsAction error:', error);
        return { success: false, message: error.message || '일괄 영구 삭제 도중 오류가 발생했습니다.' };
    }
}

/**
 * 광고 순위 직접 변경 (최상단 점프 또는 특정 순위 지정)
 */
export async function adminChangeAdRankAction(id: string, targetRank: number = 1, isJob: boolean = false) {
    try {
        const now = new Date().toISOString();
        const table = isJob ? 'jobs' : 'biz_ads';

        if (targetRank <= 1) {
            // 최상단 (1위) 점프
            await supabaseAdmin.from(table).update({ last_exposed_at: now, updated_at: now }).eq('id', id);
            if (!isJob) {
                await supabaseAdmin.from('jobs').update({ last_exposed_at: now, updated_at: now }).eq('linked_ad_id', id);
            } else {
                const { data: job } = await supabaseAdmin.from('jobs').select('linked_ad_id').eq('id', id).single();
                if (job?.linked_ad_id) {
                    await supabaseAdmin.from('biz_ads').update({ last_exposed_at: now, updated_at: now }).eq('id', job.linked_ad_id);
                }
            }
        } else {
            // 지정 순위 (targetRank위) 이동
            const { data: list } = await supabaseAdmin
                .from(table)
                .select('id, last_exposed_at, created_at')
                .neq('status', 'DELETED')
                .order('last_exposed_at', { ascending: false, nullsFirst: false });

            if (list && list.length > 0) {
                const filtered = list.filter(item => item.id !== id);
                const targetIdx = Math.min(Math.max(0, targetRank - 1), filtered.length);

                let calcTimeMs = Date.now();
                if (targetIdx === 0) {
                    const topTime = new Date(filtered[0]?.last_exposed_at || filtered[0]?.created_at || Date.now()).getTime();
                    calcTimeMs = topTime + 1000;
                } else if (targetIdx >= filtered.length) {
                    const bottomTime = new Date(filtered[filtered.length - 1]?.last_exposed_at || filtered[filtered.length - 1]?.created_at || Date.now()).getTime();
                    calcTimeMs = bottomTime - 1000;
                } else {
                    const prevTime = new Date(filtered[targetIdx - 1]?.last_exposed_at || filtered[targetIdx - 1]?.created_at || Date.now()).getTime();
                    const nextTime = new Date(filtered[targetIdx]?.last_exposed_at || filtered[targetIdx]?.created_at || Date.now()).getTime();
                    calcTimeMs = Math.floor((prevTime + nextTime) / 2);
                }

                const calculatedIso = new Date(calcTimeMs).toISOString();
                await supabaseAdmin.from(table).update({ last_exposed_at: calculatedIso, updated_at: now }).eq('id', id);
                if (!isJob) {
                    await supabaseAdmin.from('jobs').update({ last_exposed_at: calculatedIso, updated_at: now }).eq('linked_ad_id', id);
                } else {
                    const { data: job } = await supabaseAdmin.from('jobs').select('linked_ad_id').eq('id', id).single();
                    if (job?.linked_ad_id) {
                        await supabaseAdmin.from('biz_ads').update({ last_exposed_at: calculatedIso, updated_at: now }).eq('id', job.linked_ad_id);
                    }
                }
            }
        }

        await invalidateAdCache();
        revalidatePath('/', 'layout');
        revalidatePath('/fox-office/ad-rankings', 'page');
        return { success: true, message: `노출 순위가 성공적으로 변경되었습니다.` };
    } catch (error: any) {
        console.error('adminChangeAdRankAction error:', error);
        return { success: false, message: error.message || '순위 변경 도중 오류가 발생했습니다.' };
    }
}

export async function adminDeleteAdAction(id: string, isJob: boolean = false) {
    return adminSoftDeleteAdAction(id, isJob);
}

export async function adminUpdateAdAction(id: string, updateData: any, isJob: boolean = false) {
    try {
        const table = isJob ? 'jobs' : 'biz_ads';
        const { error } = await supabaseAdmin
            .from(table)
            .update({
                ...updateData,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        if (!isJob) {
            await supabaseAdmin.from('jobs').update({
                title: updateData.title,
                company_name: updateData.company_name,
                status: updateData.status,
                expires_at: updateData.expires_at,
                updated_at: new Date().toISOString()
            }).eq('linked_ad_id', id);
        } else {
            const { data: job } = await supabaseAdmin.from('jobs').select('linked_ad_id').eq('id', id).single();
            if (job?.linked_ad_id) {
                await supabaseAdmin.from('biz_ads').update({
                    title: updateData.title,
                    company_name: updateData.company_name,
                    status: updateData.status,
                    expires_at: updateData.expires_at,
                    updated_at: new Date().toISOString()
                }).eq('id', job.linked_ad_id);
            }
        }

        await invalidateAdCache();
        revalidatePath('/', 'layout');
        revalidatePath('/fox-office/ad-rankings', 'page');
        revalidatePath('/fox-office/jobs', 'page');
        return { success: true, message: '성공적으로 수정되었습니다.' };
    } catch (error: any) {
        console.error('adminUpdateAdAction error:', error);
        return { success: false, message: error.message || '수정 도중 오류가 발생했습니다.' };
    }
}
