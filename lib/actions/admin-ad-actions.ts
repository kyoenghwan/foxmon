'use server';

import { supabaseAdmin } from '../supabase';
import { revalidatePath } from 'next/cache';
import { invalidateAdCache } from '../ad-service';

export async function adminDeleteAdAction(id: string, isJob: boolean = false) {
    try {
        if (isJob) {
            // 구인글 삭제
            const { data: job } = await supabaseAdmin.from('jobs').select('linked_ad_id').eq('id', id).single();
            await supabaseAdmin.from('jobs').delete().eq('id', id);
            if (job?.linked_ad_id) {
                await supabaseAdmin.from('biz_ads').delete().eq('id', job.linked_ad_id);
            }
        } else {
            // 광고 삭제
            await supabaseAdmin.from('biz_ads').delete().eq('id', id);
            await supabaseAdmin.from('jobs').delete().eq('linked_ad_id', id);
        }

        await invalidateAdCache();
        revalidatePath('/', 'layout');
        revalidatePath('/fox-office/ad-rankings', 'page');
        revalidatePath('/fox-office/jobs', 'page');
        return { success: true, message: '성공적으로 삭제되었습니다.' };
    } catch (error: any) {
        console.error('adminDeleteAdAction error:', error);
        return { success: false, message: error.message || '삭제 도중 오류가 발생했습니다.' };
    }
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

        // 연동 항목도 같이 업데이트 (제목, 업체명, 만료일, 상태 등)
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
