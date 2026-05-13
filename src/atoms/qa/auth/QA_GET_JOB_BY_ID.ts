import { supabase } from '@/lib/supabase';
import { nvLog } from '../../../../lib/logger';
import { AdItem } from '@/lib/ad-service';

// MOCK_ADS를 ad-service에서 가져올 수 없으므로(내부 변수), 
// 실제 운영 환경에서는 DB 조회를 우선하고 실패 시 null을 반환하도록 설계합니다.

export async function QA_GET_JOB_BY_ID(jobId: string) {
  nvLog('AT', '▶️ QA_GET_JOB_BY_ID 시작', { jobId });
  
  try {
    const isSupabaseEnabled = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!isSupabaseEnabled || jobId.startsWith('mock-') || jobId.startsWith('demo-')) {
      // Mock ID에 대한 처리 (임시)
      // 실제로는 ad-service의 MOCK_ADS에 접근해야 하나, 
      // 여기서는 404 방지를 위해 기본 목업 구조를 반환합니다.
      return {
        success: true,
        data: {
          id: jobId,
          company: '프리미엄 광고 업체',
          title: '최고의 대우와 환경을 보장합니다',
          location: '서울 강남구 역삼동',
          pay: '[시급] 70,000원',
          time: '19:00 ~ 03:00 (협의 가능)',
          tier: 'PREMIUM',
          is_big: true,
          image: 'https://picsum.photos/seed/job/800/600',
          created_at: new Date().toISOString()
        }
      };
    }

    let { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      // jobs에서 못 찾으면 biz_ads에서 검색
      const { data: bizData, error: bizError } = await supabase
        .from('biz_ads')
        .select('*')
        .eq('id', jobId)
        .single();
        
      if (bizError || !bizData) {
         nvLog('AT', '❌ QA_GET_JOB_BY_ID 에러', error?.message || bizError?.message);
         return { success: false, error: error?.message || bizError?.message };
      }
      data = bizData;
    }

    // 공통 코드 치환 (편의사항 및 키워드)
    try {
      const { QA_GET_COMMON_CODES } = await import('../master/QA_GET_COMMON_CODES');
      const { data: commonCodes } = await QA_GET_COMMON_CODES(undefined, true);
      
      if (commonCodes && Array.isArray(commonCodes)) {
        if (Array.isArray(data.amenities)) {
          data.amenities = data.amenities.map((code: string) => {
            const match = commonCodes.find(c => c.code_value === code && c.list_type === 'AMENITY');
            return match ? match.code_name : code;
          });
        }
        if (Array.isArray(data.keywords)) {
          data.keywords = data.keywords.map((code: string) => {
            const match = commonCodes.find(c => c.code_value === code && c.list_type === 'KEYWORD');
            return match ? match.code_name : code;
          });
        }
      }
    } catch (codeError) {
      nvLog('AT', '⚠️ 공통 코드 치환 실패 (무시됨)', codeError);
    }

    return { success: true, data };
  } catch (error: any) {
    nvLog('AT', '❌ QA_GET_JOB_BY_ID 실패', error.message);
    return { success: false, error: error.message };
  }
}
