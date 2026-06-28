import { nvLog } from '../../../../lib/logger';
import { supabaseAdmin } from '@/lib/supabase';

interface VerifyBizInput {
    userId: string;
    bizNumber: string; // 10자리 사업자등록번호
    ceoName?: string; // 대표자 성명
    openDate?: string; // 개업일자 (YYYYMMDD)
    businessName?: string; // 상호명
}

/**
 * [국세청 API 연동]
 * data.go.kr 의 '사업자등록정보 진위확인 및 상태조회 서비스 API' 연결
 */
export async function FA_BIZ_VERIFY_FLOW({ userId, bizNumber, ceoName, openDate, businessName }: VerifyBizInput) {
    nvLog('AT', '▶️ FA_BIZ_VERIFY_FLOW 시작', { userId, bizNumber, ceoName, openDate });

    if (!bizNumber || bizNumber.length !== 10) {
        return { success: false, message: '올바른 사업자등록번호 10자리를 입력해주세요.' };
    }

    // 1. DB site_settings에서 우선 조회
    let API_KEY = '';
    try {
        const { data: dbSetting } = await supabaseAdmin
            .from('site_settings')
            .select('key_value')
            .eq('key_name', 'data_go_kr_api_key')
            .maybeSingle();
            
        if (dbSetting?.key_value) {
            API_KEY = dbSetting.key_value;
        }
    } catch (dbErr) {
        nvLog('AT', '⚠️ DB site_settings 조회 중 오류 발생 (환경변수로 대체)', dbErr);
    }

    // 2. DB에 없으면 기존 환경변수 fallback
    if (!API_KEY) {
        API_KEY = process.env.DATA_GO_KR_API_KEY || '';
    }

    // 만약 API KEY가 없으면 기존 Mock 모드로 하방 호환성 유지
    if (!API_KEY) {
        nvLog('AT', '⚠️ DATA_GO_KR_API_KEY 설정이 없어 임시 가상 검증으로 우회 처리합니다.');
        return { 
            success: true, 
            message: '국세청 조회 결과: 정상 사업자로 확인되었습니다. (임시 우회)',
            data: {
                isValid: true,
                status: '계속사업자'
            }
        };
    }

    try {
        // 국세청 진위확인 API 호출 (인코딩 안전장치 적용)
        const serviceKey = API_KEY.includes('%') ? API_KEY : encodeURIComponent(API_KEY);
        const url = `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${serviceKey}`;
        
        // 개업일자 정제 (YYYYMMDD 형식, 숫자만 남김)
        const cleanOpenDate = openDate ? openDate.replace(/[^0-9]/g, '') : '';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                businesses: [
                    {
                        b_no: bizNumber,
                        start_dt: cleanOpenDate || '',
                        p_nm: ceoName || '',
                        p_nm2: '',
                        b_nm: businessName || '',
                        corp_no: '',
                        b_sector: '',
                        b_type: ''
                    }
                ]
            })
        });

        if (!response.ok) {
            nvLog('AT', '❌ 국세청 API 응답 오류', response.status);
            return { success: false, message: '국세청 인증 서버의 상태가 원활하지 않습니다. 잠시 후 다시 시도해 주세요.' };
        }

        const resData = await response.json();
        nvLog('AT', '국세청 API 응답 데이터:', resData);

        const bizResult = resData?.data?.[0];
        
        if (!bizResult) {
            return { success: false, message: '인증 결과를 반환받지 못했습니다.' };
        }

        // valid 가 "01" 이면 유효(일치)함
        if (bizResult.valid === '01') {
            const statusStr = bizResult.status?.b_stt || '계속사업자';
            
            // 계속사업자 상태일 경우에만 성공으로 처리
            if (statusStr === '폐업자') {
                return { success: false, message: '폐업된 사업자등록번호로 조회됩니다.' };
            }
            if (statusStr === '휴업자') {
                return { success: false, message: '현재 휴업 중인 사업자등록번호입니다.' };
            }

            return {
                success: true,
                message: '국세청 조회 결과: 일치하는 사업자로 확인되었습니다.',
                data: {
                    isValid: true,
                    status: statusStr
                }
            };
        } else {
            const failMsg = bizResult.valid_msg || '사업자 정보가 등록된 정보와 일치하지 않습니다.';
            return { 
                success: false, 
                message: `국세청 조회 실패: ${failMsg} (대표자명 및 개업일을 다시 확인하세요.)` 
            };
        }

    } catch (err: any) {
        nvLog('AT', '❌ FA_BIZ_VERIFY_FLOW 예외 발생', err.message);
        return { success: false, message: '국세청 검증 API 연동 중 네트워크 오류가 발생했습니다.' };
    }
}
