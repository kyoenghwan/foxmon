"use server";

import { createClient } from "@/utils/supabase/server";

export async function getSiteSettings() {
    const supabase = await createClient();
    
    // 이 작업은 안전을 위해 Role 체크 등을 수행할 수 있습니다.
    // 하지만 본 예제에서는 RLS가 DB 레벨에서 보호하고 있다고 가정합니다.
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
        .from('site_settings')
        .select('*');

    if (error) {
        console.error("getSiteSettings Error:", error);
        return { success: false, error: error.message };
    }

    // 배열 형태를 key-value 객체 형태로 변환하여 프론트에 전달
    const settingsMap = data.reduce((acc, row) => {
        acc[row.key_name] = row.key_value;
        return acc;
    }, {} as Record<string, string>);

    return { success: true, data: settingsMap };
}

export async function updateSiteSettings(payload: Record<string, string>) {
    const supabase = await createClient();
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
        return { success: false, error: 'Unauthorized' };
    }

    // 각 키에 대해 UPSERT 수행
    const entries = Object.entries(payload);
    let hasError = false;

    for (const [key, value] of entries) {
        const { error } = await supabase
            .from('site_settings')
            .upsert({
                category: key.includes('api_key') ? 'api_keys' : 'general',
                key_name: key,
                key_value: value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key_name' });

        if (error) {
            console.error(`Error updating setting ${key}:`, error);
            hasError = true;
        }
    }

    if (hasError) {
        return { success: false, error: 'Failed to update some settings' };
    }

    return { success: true };
}
