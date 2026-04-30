import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedMasterData() {
    console.log('Seeding Master Data...');

    const data = [
        // --- EMPLOYMENT_TYPE ---
        { list_type: 'EMPLOYMENT_TYPE', code_value: 'EMP_01', code_name: '고용', sort_order: 1, is_active: true },
        { list_type: 'EMPLOYMENT_TYPE', code_value: 'EMP_02', code_name: '파견', sort_order: 2, is_active: true },
        { list_type: 'EMPLOYMENT_TYPE', code_value: 'EMP_03', code_name: '도급', sort_order: 3, is_active: true },
        { list_type: 'EMPLOYMENT_TYPE', code_value: 'EMP_04', code_name: '위임', sort_order: 4, is_active: true },

        // --- CATEGORY_1 ---
        { list_type: 'CATEGORY_1', code_value: 'CAT1_ROOM', code_name: '룸싸롱', sort_order: 1, is_active: true },
        { list_type: 'CATEGORY_1', code_value: 'CAT1_KARAOKE', code_name: '노래주점', sort_order: 2, is_active: true },
        { list_type: 'CATEGORY_1', code_value: 'CAT1_MASSAGE', code_name: '마사지', sort_order: 3, is_active: true },
        { list_type: 'CATEGORY_1', code_value: 'CAT1_OTHER', code_name: '기타', sort_order: 4, is_active: true },

        // --- CATEGORY_2 (ROOM) ---
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_ROOM', code_value: 'CAT2_R_01', code_name: '텐프로', sort_order: 1, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_ROOM', code_value: 'CAT2_R_02', code_name: '쩜오', sort_order: 2, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_ROOM', code_value: 'CAT2_R_03', code_name: '퍼블릭', sort_order: 3, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_ROOM', code_value: 'CAT2_R_04', code_name: '클럽', sort_order: 4, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_ROOM', code_value: 'CAT2_R_05', code_name: '정통룸', sort_order: 5, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_ROOM', code_value: 'CAT2_R_06', code_name: '풀싸롱', sort_order: 6, is_active: true },

        // --- CATEGORY_2 (KARAOKE) ---
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_KARAOKE', code_value: 'CAT2_K_01', code_name: '아가씨', sort_order: 1, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_KARAOKE', code_value: 'CAT2_K_02', code_name: '초미씨A', sort_order: 2, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_KARAOKE', code_value: 'CAT2_K_03', code_name: '초미씨B', sort_order: 3, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_KARAOKE', code_value: 'CAT2_K_04', code_name: '미씨', sort_order: 4, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_KARAOKE', code_value: 'CAT2_K_05', code_name: 'TC', sort_order: 5, is_active: true },

        // --- CATEGORY_2 (MASSAGE) ---
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_MASSAGE', code_value: 'CAT2_M_01', code_name: '휴게 마사지', sort_order: 1, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_MASSAGE', code_value: 'CAT2_M_02', code_name: '아로마 마사지', sort_order: 2, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_MASSAGE', code_value: 'CAT2_M_03', code_name: '피부 마사지', sort_order: 3, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_MASSAGE', code_value: 'CAT2_M_04', code_name: '에스테틱', sort_order: 4, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_MASSAGE', code_value: 'CAT2_M_05', code_name: '스포츠마사지', sort_order: 5, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_MASSAGE', code_value: 'CAT2_M_06', code_name: '기타마사지', sort_order: 6, is_active: true },

        // --- CATEGORY_2 (OTHER) ---
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_OTHER', code_value: 'CAT2_O_01', code_name: '기타업종', sort_order: 1, is_active: true },
        { list_type: 'CATEGORY_2', parent_code_value: 'CAT1_OTHER', code_value: 'CAT2_O_02', code_name: '직업소개소', sort_order: 2, is_active: true },

        // --- AMENITY ---
        { list_type: 'AMENITY', code_value: 'AM_01', code_name: '선불가능', sort_order: 1, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_02', code_name: '출퇴근지원', sort_order: 2, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_03', code_name: '갯수보장', sort_order: 3, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_04', code_name: '띠당가능', sort_order: 4, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_05', code_name: '숙식제공', sort_order: 5, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_06', code_name: '순번확실', sort_order: 6, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_07', code_name: '식사제공', sort_order: 7, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_08', code_name: '지명우대', sort_order: 8, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_09', code_name: '추석가능', sort_order: 9, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_10', code_name: '월급제공', sort_order: 10, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_11', code_name: '팁별도', sort_order: 11, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_12', code_name: '초이스없음', sort_order: 12, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_13', code_name: '밀방없음', sort_order: 13, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_14', code_name: '만근비지원', sort_order: 14, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_15', code_name: '인센티브', sort_order: 15, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_16', code_name: '해외여행지원', sort_order: 16, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_17', code_name: '탈퇴보장', sort_order: 17, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_18', code_name: '성형지원', sort_order: 18, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_19', code_name: '홀복지원', sort_order: 19, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_20', code_name: '텃방없음', sort_order: 20, is_active: true },
        { list_type: 'AMENITY', code_value: 'AM_21', code_name: '텃세없음', sort_order: 21, is_active: true },

        // --- KEYWORD ---
        { list_type: 'KEYWORD', code_value: 'KW_01', code_name: '신규업소', sort_order: 1, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_02', code_name: '투잡알바', sort_order: 2, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_03', code_name: '주점', sort_order: 3, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_04', code_name: '마사지', sort_order: 4, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_05', code_name: 'TC', sort_order: 5, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_06', code_name: '타지역우대', sort_order: 6, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_07', code_name: '초보가능', sort_order: 7, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_08', code_name: '당일지급', sort_order: 8, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_09', code_name: '비', sort_order: 9, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_10', code_name: '아가씨', sort_order: 10, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_11', code_name: '44사이즈우대', sort_order: 11, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_12', code_name: '에이스우대', sort_order: 12, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_13', code_name: '경력우대', sort_order: 13, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_14', code_name: '생리휴무', sort_order: 14, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_15', code_name: '요정', sort_order: 15, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_16', code_name: '초미녀', sort_order: 16, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_17', code_name: '박스환영', sort_order: 17, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_18', code_name: '업소', sort_order: 18, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_19', code_name: '주말알바', sort_order: 19, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_20', code_name: '룸싸롱', sort_order: 20, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_21', code_name: '다방', sort_order: 21, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_22', code_name: '미씨', sort_order: 22, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_23', code_name: '장기근무', sort_order: 23, is_active: true },
        { list_type: 'KEYWORD', code_value: 'KW_24', code_name: '기타 등등', sort_order: 24, is_active: true },
    ];

    for (const item of data) {
        const { data: existing } = await supabase.from('common_codes').select('code_value').eq('code_value', item.code_value).single();
        if (!existing) {
            const { error } = await supabase.from('common_codes').insert(item);
            if (error) {
                console.error(`Error inserting ${item.code_value}:`, error);
            } else {
                console.log(`Inserted ${item.code_name}`);
            }
        } else {
            console.log(`Skipped ${item.code_name} (already exists)`);
        }
    }

    console.log('Done!');
}

seedMasterData();
