import { supabase } from '../../../../lib/supabase';
import { nvLog } from '../../../../lib/logger';

interface SearchResumesParams {
  gender?: 'MALE' | 'FEMALE';
  minAge?: number;
  maxAge?: number;
  regionProvince?: string;
  regionCity?: string;
  limit?: number;
  offset?: number;
}

export async function QA_SEARCH_RESUMES(params: SearchResumesParams) {
  nvLog('AT', '▶️ QA_SEARCH_RESUMES 시작', params);

  try {
    let query = supabase
      .from('resumes')
      .select(`
        *,
        user:users (
          name,
          nickname,
          gender,
          birth_date,
          role
        )
      `)
      .eq('is_active', true);

    // 1. Gender Filter
    if (params.gender) {
      query = query.eq('users.gender', params.gender);
    }

    // 2. Region Filter
    if (params.regionProvince) {
      query = query.eq('region_province', params.regionProvince);
    }
    if (params.regionCity) {
      query = query.eq('region_city', params.regionCity);
    }

    // 3. Pagination
    const from = params.offset || 0;
    const to = from + (params.limit || 20) - 1;
    query = query.range(from, to).order('updated_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    // 4. Client-side Age Filtering (Supabase doesn't easily calculate age from string YYYYMMDD in simple queries without extensions)
    let filteredData = data || [];

    if (params.minAge || params.maxAge) {
      const currentYear = new Date().getFullYear();
      filteredData = filteredData.filter((item: any) => {
        if (!item.user?.birth_date) return false;
        const birthYear = parseInt(item.user.birth_date.substring(0, 4), 10);
        const age = currentYear - birthYear;
        
        const minPass = params.minAge ? age >= params.minAge : true;
        const maxPass = params.maxAge ? age <= params.maxAge : true;
        return minPass && maxPass;
      });
    }

    nvLog('AT', '✅ QA_SEARCH_RESUMES 성공', { count: filteredData.length });
    return { success: true, data: filteredData };

  } catch (error: any) {
    nvLog('AT', '❌ QA_SEARCH_RESUMES 실패', error.message);
    return { success: false, error: error.message };
  }
}
