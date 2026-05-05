import { nvLog } from '../../../../lib/logger';
import { QA_GET_EMPLOYER_LIST } from '../../qa/admin/QA_GET_EMPLOYER_LIST';
import { OA_TOGGLE_BUSINESS_VERIFY } from '../../oa/admin/OA_TOGGLE_BUSINESS_VERIFY';

export interface AdminEmployerFlowInput {
    actionType: 'GET_LIST' | 'TOGGLE_VERIFY' | 'GIVE_POINTS';
    adminId: string;
    targetUserId?: string;
    isVerified?: boolean;
    paidPointsDiff?: number;
    bonusPointsDiff?: number;
    description?: string;
}

export async function FA_ADMIN_EMPLOYER_FLOW(input: AdminEmployerFlowInput) {
    nvLog('AT', `▶️ FA_ADMIN_EMPLOYER_FLOW [${input.actionType}] 시작`, { adminId: input.adminId });

    try {
        switch (input.actionType) {
            case 'GET_LIST': {
                const result = await QA_GET_EMPLOYER_LIST();
                return result;
            }
            case 'TOGGLE_VERIFY': {
                if (!input.targetUserId || input.isVerified === undefined) {
                    return { success: false, message: '필수 파라미터 누락' };
                }
                const result = await OA_TOGGLE_BUSINESS_VERIFY({
                    userId: input.targetUserId,
                    isVerified: input.isVerified
                });
                return result;
            }
            case 'GIVE_POINTS': {
                if (!input.targetUserId || input.paidPointsDiff === undefined || input.bonusPointsDiff === undefined || !input.description) {
                    return { success: false, message: '필수 파라미터 누락' };
                }
                const { OA_ADMIN_GIVE_POINTS } = await import('../../oa/admin/OA_ADMIN_GIVE_POINTS');
                const result = await OA_ADMIN_GIVE_POINTS({
                    userId: input.targetUserId,
                    paidPointsDiff: input.paidPointsDiff,
                    bonusPointsDiff: input.bonusPointsDiff,
                    description: input.description,
                    adminId: input.adminId
                });
                return result;
            }
            default:
                return { success: false, message: '유효하지 않은 Action Type 입니다.' };
        }
    } catch (error: any) {
        nvLog('AT', `❌ FA_ADMIN_EMPLOYER_FLOW 시스템 에러`, error.message);
        return { success: false, message: '시스템 오류가 발생했습니다.' };
    }
}
