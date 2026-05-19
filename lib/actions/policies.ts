'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getPolicy(type: 'ABOUT' | 'TERMS' | 'PRIVACY' | 'YOUTH') {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('site_policies')
        .select('content')
        .eq('type', type)
        .single();

    if (error) {
        console.error('Error fetching policy:', error);
        return '내용이 등록되지 않았습니다.';
    }

    return data?.content || '내용이 등록되지 않았습니다.';
}

export async function updatePolicy(type: 'ABOUT' | 'TERMS' | 'PRIVACY' | 'YOUTH', content: string) {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession();
    const role = (session?.user as any)?.role;
    
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        return { success: false, error: '권한이 없습니다.' };
    }

    const { error } = await supabase
        .from('site_policies')
        .upsert({ type, content, updated_at: new Date().toISOString() }, { onConflict: 'type' });

    if (error) {
        console.error('Error updating policy:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/', 'layout'); // Revalidate footer layout
    return { success: true };
}
