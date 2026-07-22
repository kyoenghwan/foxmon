const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://kgwvftaebjkjwwpsftqv.supabase.co";
// service_role 키를 사용해야 RLS 우회하여 마스터 코드 테이블을 수정할 수 있음
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZmdGFlYmprand3cHNmdHF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIyNzAwMiwiZXhwIjoyMDg2ODAzMDAyfQ.7P5tD8e4_yXv2R60L2rW62v1N0hQ4v4dD6d1E7d8e9";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log("Starting to seed common_codes for inquiry types...");

    // 1. SYSTEM_LIST_TYPES 에 INQUIRY_TYPE 분류 그룹 추가
    const { data: sysType, error: err1 } = await supabase
        .from('common_codes')
        .upsert({
            list_type: 'SYSTEM_LIST_TYPES',
            code_value: 'INQUIRY_TYPE',
            code_name: '1:1 문의 유형',
            sort_order: 100,
            is_active: true,
            description: '1:1 고객 문의 작성 시 선택하는 구분 옵션 리스트'
        }, { onConflict: 'list_type,code_value' })
        .select();

    if (err1) {
        console.error("Error inserting system list type:", err1);
        return;
    }
    console.log("Successfully seeded SYSTEM_LIST_TYPES group for INQUIRY_TYPE:", sysType);

    // 2. INQUIRY_TYPE 에 속하는 하위 공통 코드 아이템 추가
    const inquiryCodes = [
        { list_type: 'INQUIRY_TYPE', code_value: 'INQUIRY_ACCOUNT', code_name: '계좌 문의', sort_order: 10, is_active: true, description: '무통장 입금 계좌 안내 자동 답변 연동' },
        { list_type: 'INQUIRY_TYPE', code_value: 'INQUIRY_MEMBER', code_name: '계정 문의', sort_order: 20, is_active: true, description: '아이디/비밀번호 찾기, 탈퇴 등 계정 관련 문의' },
        { list_type: 'INQUIRY_TYPE', code_value: 'INQUIRY_POINT', code_name: '포인트·환불', sort_order: 30, is_active: true, description: '포인트 지급/차감 및 환불/취소 관련 문의' },
        { list_type: 'INQUIRY_TYPE', code_value: 'INQUIRY_AD', code_name: '광고 문의', sort_order: 40, is_active: true, description: '광고 등록 및 노출 관련 문의' },
        { list_type: 'INQUIRY_TYPE', code_value: 'INQUIRY_REPORT', code_name: '신고·제재', sort_order: 50, is_active: true, description: '게시글 신고 및 계정 제재 이의제기' },
        { list_type: 'INQUIRY_TYPE', code_value: 'INQUIRY_SUGGEST', code_name: '건의사항', sort_order: 60, is_active: true, description: '기능 제안 및 사이트 개선 건의' },
        { list_type: 'INQUIRY_TYPE', code_value: 'INQUIRY_ETC', code_name: '기타', sort_order: 70, is_active: true, description: '기타 문의사항' }
    ];

    for (const code of inquiryCodes) {
        const { data, error } = await supabase
            .from('common_codes')
            .upsert(code, { onConflict: 'list_type,code_value' })
            .select();

        if (error) {
            console.error(`Error inserting common code ${code.code_value}:`, error);
        } else {
            console.log(`Successfully seeded inquiry code ${code.code_name}:`, data);
        }
    }

    console.log("Seeding inquiry types completed successfully!");
}

run();
