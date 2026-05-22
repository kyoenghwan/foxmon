'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export async function uploadVerificationDocument(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) {
            return { success: false, message: '파일이 없습니다.' };
        }

        // Convert File to Buffer/ArrayBuffer for Supabase Storage
        const arrayBuffer = await file.arrayBuffer();
        let buffer: Buffer = Buffer.from(arrayBuffer);
        let contentType = file.type;
        let fileExt = file.name.split('.').pop() || 'png';

        if (file.type.startsWith('image/')) {
            const { optimizeToWebp } = await import('@/lib/image-optimizer');
            const optimized = await optimizeToWebp(buffer);
            buffer = optimized.buffer;
            contentType = optimized.contentType;
            fileExt = optimized.ext;
        }

        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = `verifications/${fileName}`;

        const { data, error } = await supabaseAdmin.storage
            .from('verification_docs')
            .upload(filePath, buffer, {
                contentType: contentType,
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
