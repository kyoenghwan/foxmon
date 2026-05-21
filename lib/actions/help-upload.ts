'use server';

import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdminRole } from '@/lib/normalize-user-role';
import { randomUUID } from 'crypto';

const BUCKETS = ['help_assets', 'verification_docs'] as const;

export async function uploadHelpFaqImage(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  markdown?: string;
  message?: string;
}> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !isAdminRole(role)) {
    return { success: false, message: '권한이 없습니다.' };
  }

  const file = formData.get('file') as File | null;
  if (!file?.size) {
    return { success: false, message: '파일을 선택해 주세요.' };
  }

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return { success: false, message: 'JPEG, PNG, GIF, WebP 이미지만 업로드할 수 있습니다.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, message: '이미지는 5MB 이하만 가능합니다.' };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  
  // WebP 이미지로 최적화 변환 (애니메이션 지원)
  const { optimizeToWebp } = await import('@/lib/image-optimizer');
  const optimized = await optimizeToWebp(buffer);

  const filePath = `faq/${randomUUID()}.${optimized.ext}`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  for (const bucket of BUCKETS) {
    const { error } = await supabaseAdmin.storage.from(bucket).upload(filePath, optimized.buffer, {
      contentType: optimized.contentType,
      upsert: false,
    });
    if (error) continue;

    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
    const url = pub.publicUrl;
    return {
      success: true,
      url,
      markdown: `![${file.name.replace(/\.[^/.]+$/, "")}.webp](${url})`,
    };
  }

  return {
    success: false,
    message:
      '이미지 업로드에 실패했습니다. Supabase Storage에 help_assets(공개) 버킷을 만들거나, 마크다운에 이미지 URL을 직접 입력해 주세요.',
  };
}
