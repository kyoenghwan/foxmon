import { nvLog } from '@/lib/logger';
import { FA_GET_REFUND_SIMULATION } from '@/src/atoms/fa/points/FA_GET_REFUND_SIMULATION';
import { OA_SUBMIT_REFUND_REQUEST } from '@/src/atoms/oa/points/OA_SUBMIT_REFUND_REQUEST';

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface RequestRefundFlowInput {
  userId: string;
  bankInfo: BankInfo;
}

interface RequestRefundFlowOutput {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * [FA] FA_REQUEST_REFUND_FLOW
 * 사용자의 계좌 정보를 받아 실시간 환불액 검증 후 최종 신청을 접수하고 포인트를 소멸시키는 통합 플로우입니다.
 */
export const FA_REQUEST_REFUND_FLOW = async (input: RequestRefundFlowInput): Promise<RequestRefundFlowOutput> => {
  const { userId, bankInfo } = input;

  try {
    nvLog('AT', `▶️ FA_REQUEST_REFUND_FLOW 시작`, { userId });

    // 💡 1단계: 신청 시점 실시간 환불액 재검증 (QA + RA)
    const simulationResult = await FA_GET_REFUND_SIMULATION(userId);
    if (!simulationResult.success || !simulationResult.data) {
      throw new Error(simulationResult.reason || '환불 정보를 검증하는 중 오류가 발생했습니다.');
    }
    const simulation = simulationResult.data;

    if (simulation.totalRefundAmount <= 0) {
      throw new Error('환불 가능액이 0원 이하이므로 신청할 수 없습니다.');
    }

    // 💡 2단계: 최종 신청 접수 및 포인트 소멸 트랜잭션 (OA)
    const result = await OA_SUBMIT_REFUND_REQUEST({
      userId,
      refundableCash: simulation.totalRefundAmount,
      bankInfo
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || '환불 신청 처리 중 오류가 발생했습니다.');
    }

    // 💡 3단계: 사용자에게 처리 안내 메시지 반환
    const message = `총 ${simulation.totalRefundAmount.toLocaleString()}원의 환불 신청이 정상적으로 접수되었습니다. 신청하신 계좌(${bankInfo.bankName})로 영업일 기준 3일 이내에 입금될 예정입니다.`;

    nvLog('AT', `✅ FA_REQUEST_REFUND_FLOW 성곡`, { userId, requestId: result.data.requestId });

    return {
      success: true,
      data: {
        requestId: result.data.requestId,
        refundAmount: simulation.totalRefundAmount
      },
      message
    };
  } catch (error: any) {
    nvLog('AT', `❌ FA_REQUEST_REFUND_FLOW 에러`, error.message);
    return {
      success: false,
      error: error.message,
      message: '환불 신청에 실패했습니다. 고객센터로 문의해 주세요.'
    };
  }
};
