const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(url, key);

async function run() {
    console.log('🔄 기존 광고 -> 구인관리 일괄 연동 동기화 마이그레이션 시작 (RPC execute_sql)');

    const sql = `
DO $$
DECLARE
    ad_row RECORD;
BEGIN
    FOR ad_row IN SELECT * FROM public.biz_ads LOOP
        -- 해당 광고에 연동된 구인글이 있는지 확인
        IF EXISTS (SELECT 1 FROM public.jobs WHERE linked_ad_id = ad_row.id) THEN
            UPDATE public.jobs
            SET
                title = ad_row.title,
                company_name = ad_row.company_name,
                location = ad_row.location,
                address = ad_row.address,
                salary_type = ad_row.salary_type,
                salary_amount = ad_row.salary_amount,
                logo_url = ad_row.logo_url,
                image_url = ad_row.image_url,
                contact_name = ad_row.contact_name,
                contact_phone = ad_row.contact_phone,
                kakao_id = ad_row.kakao_id,
                line_id = ad_row.line_id,
                telegram_id = ad_row.telegram_id,
                wechat_id = ad_row.wechat_id,
                employment_type = ad_row.employment_type,
                category1 = ad_row.category1,
                category2 = ad_row.category2,
                work_time = ad_row.work_time,
                amenities = ad_row.amenities,
                keywords = ad_row.keywords,
                design_mode = ad_row.design_mode,
                content = ad_row.detail_content,
                detail_content = ad_row.detail_content,
                detail_bg_color = ad_row.detail_bg_color,
                detail_bg_image = ad_row.detail_bg_image,
                tier = ad_row.tier,
                status = ad_row.status,
                expires_at = ad_row.expires_at,
                exposure_period = ad_row.exposure_period,
                is_subscription = ad_row.is_subscription,
                option_bold = COALESCE(ad_row.option_double_slot, false),
                option_jump = COALESCE(ad_row.option_jump, false),
                jump_interval = COALESCE(ad_row.jump_interval, 4),
                last_jumped_at = ad_row.last_jumped_at,
                last_exposed_at = ad_row.last_exposed_at,
                updated_at = NOW()
            WHERE linked_ad_id = ad_row.id;
        ELSE
            INSERT INTO public.jobs (
                user_id, linked_ad_id, title, company_name, location, address,
                salary_type, salary_amount, logo_url, image_url, contact_name, contact_phone,
                kakao_id, line_id, telegram_id, wechat_id, employment_type, category1, category2,
                work_time, amenities, keywords, design_mode, content, detail_content,
                detail_bg_color, detail_bg_image, tier, status, expires_at, exposure_period,
                is_subscription, option_bold, option_jump, jump_interval, last_jumped_at, last_exposed_at, total_points
            ) VALUES (
                ad_row.user_id, ad_row.id, ad_row.title, ad_row.company_name, ad_row.location, ad_row.address,
                ad_row.salary_type, ad_row.salary_amount, ad_row.logo_url, ad_row.image_url, ad_row.contact_name, ad_row.contact_phone,
                ad_row.kakao_id, ad_row.line_id, ad_row.telegram_id, ad_row.wechat_id, ad_row.employment_type, ad_row.category1, ad_row.category2,
                ad_row.work_time, ad_row.amenities, ad_row.keywords, ad_row.design_mode, ad_row.detail_content, ad_row.detail_content,
                ad_row.detail_bg_color, ad_row.detail_bg_image, COALESCE(ad_row.tier, 'GENERAL'), COALESCE(ad_row.status, 'PAUSED'), ad_row.expires_at, COALESCE(ad_row.exposure_period, 30),
                COALESCE(ad_row.is_subscription, false), COALESCE(ad_row.option_double_slot, false), COALESCE(ad_row.option_jump, false), COALESCE(ad_row.jump_interval, 4), ad_row.last_jumped_at, ad_row.last_exposed_at, 0
            );
        END IF;
    END LOOP;
END $$;
    `;

    const { data, error } = await supabase.rpc('execute_sql', { sql });

    if (error) {
        console.error('❌ 마이그레이션 실패:', error);
    } else {
        console.log('✅ 마이그레이션 성공적으로 완료되었습니다!', data || 'OK');
    }
}

run();
