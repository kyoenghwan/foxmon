'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export async function uploadVerificationDocument(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, message: '파일이 없습니다.' };
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = `verifications/${fileName}`;

        // Convert File to Buffer/ArrayBuffer for Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error } = await supabaseAdmin.storage
            .from('verification_docs')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Storage upload error:', error);
            return { success: false, message: '파일 업로드에 실패했습니다.' };
        }

        // Return the public URL or just the path (it's a private bucket, so we store the path)
        return { success: true, url: filePath };
    } catch (err: any) {
        console.error('Upload system error:', err);
        return { success: false, message: '업로드 시스템 오류가 발생했습니다.' };
    }
}
