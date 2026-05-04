import { nvLog } from '../../../../lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

interface VerifyBizInput {
    userId: string;
    bizNumber: string; // 10자리 사업자등록번호
    ceoName?: string; // 대표자 성명
    openDate?: string; // 개업일자 (YYYYMMDD)
}

/**
 * [가짜(Mock) 국세청 API 연동]
 * 향후 data.go.kr 의 '사업자등록정보 진위확인 및 상태조회 서비스 API' 연결 예정
 */
export async function FA_BIZ_VERIFY_FLOW({ userId, bizNumber, ceoName, openDate }: VerifyBizInput) {
    nvLog('AT', '▶️ FA_BIZ_VERIFY_FLOW 시작', { userId, bizNumber });

    try {
        // [TODO: 실제 국세청 API 호출 로직 (fetch)]
        // const API_KEY = process.env.DATA_GO_KR_API_KEY;
        // const res = await fetch(`https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${API_KEY}`, { ... });

        // 현재는 API 키가 없으므로 무조건 성공하는 Mock 로직
        // 만약 bizNumber가 10자리가 안되면 에러
        if (!bizNumber || bizNumber.length !== 10) {
            return { success: false, message: '올바른 사업자등록번호 10자리를 입력해주세요.' };
        }

        // Mock 성공 응답
        nvLog('AT', '✅ FA_BIZ_VERIFY_FLOW: 국세청 진위확인 성공 (Mock)');
        return { 
            success: true, 
            message: '국세청 조회 결과: 정상 사업자로 확인되었습니다.',
            data: {
                isValid: true,
                status: '계속사업자' // 계속사업자, 휴업자, 폐업자
            }
        };
    } catch (err: any) {
        nvLog('AT', '❌ FA_BIZ_VERIFY_FLOW 에러', err.message);
        return { success: false, message: '인증 서버 통신 중 오류가 발생했습니다.' };
    }
}
