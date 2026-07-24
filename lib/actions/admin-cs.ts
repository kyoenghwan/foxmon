'use server';

import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';
import { FA_RECHARGE_POINT_FLOW } from '@/src/atoms/fa/points/FA_RECHARGE_POINT_FLOW';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

/**
 * NextAuth 세션 및 CS 독립 기기 세션 모두에서 관리자 권한을 안전하게 검증하는 공통 헬퍼
 */
async function verifyAdminPermission(): Promise<{ success: boolean; userId?: string }> {
  // 1. NextAuth 세션 검사
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  if (session?.user?.id && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN')) {
    return { success: true, userId: session.user.id };
  }

  // 2. 독립 CS 세션 쿠키 검사
  const cookieStore = await cookies();
  const csSessionToken = cookieStore.get('cs_session_token')?.value;
  if (csSessionToken && csSessionToken.startsWith('CS_SESSION_')) {
    const adminUserId = csSessionToken.split('_')[2];
    if (adminUserId) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', adminUserId)
        .single();

      if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
        return { success: true, userId: adminUserId };
      }
    }
  }

  return { success: false };
}

/**
 * 1:1 고객 문의에 관리자 답변 등록
 */
export async function replyInquiry(payload: {
  inquiryId: string;
  replyContent: string;
}) {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, message: '관리자 권한이 없습니다.' };
  }

  const { inquiryId, replyContent } = payload;
  if (!inquiryId || !replyContent.trim()) {
    return { success: false, message: '답변 내용을 입력해 주세요.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('inquiries')
      .update({
        reply: replyContent.trim(),
        status: 'ANSWERED',
        replied_at: new Date().toISOString(),
      })
      .eq('id', inquiryId);

    if (error) {
      nvLog('FW', '❌ 1:1 문의 답변 등록 실패', error.message);
      return { success: false, message: '답변을 등록하지 못했습니다.' };
    }

    revalidatePath('/cs');
    return { success: true, message: '답변이 성공적으로 등록되었습니다.' };
  } catch (err: any) {
    nvLog('FW', '❌ 1:1 문의 답변 등록 오류', err.message);
    return { success: false, message: '답변 등록 중 오류가 발생했습니다.' };
  }
}

/**
 * 무통장 입금 신청 건 최종 승인 및 포인트 지급
 */
export async function approveRechargeRequest(requestId: string) {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, message: '관리자 권한이 없습니다.' };
  }

  if (!requestId) {
    return { success: false, message: '요청 ID가 누락되었습니다.' };
  }

  try {
    // 1. 신청 내역 조회
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('point_recharge_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return { success: false, message: '충전 신청 내역을 찾을 수 없습니다.' };
    }

    if (request.status !== 'PENDING') {
      return { success: false, message: `이미 처리 완료된 신청 건입니다. (현재 상태: ${request.status})` };
    }

    nvLog('FW', '💳 무통장 입금 승인 처리 진행', { requestId, userId: request.user_id, amount: request.amount });

    // 2. 통합 포인트 충전 플로우(FA_RECHARGE_POINT_FLOW) 실행
    // 이 플로우는 전역 포인트 정책 조회, 등급별 보너스 연산, DB 적립 및 로그 적재를 원자적으로 수행합니다.
    const rechargeResult = await FA_RECHARGE_POINT_FLOW({
      userId: request.user_id,
      cashAmount: Number(request.amount),
    });

    if (!rechargeResult.success) {
      nvLog('FW', '❌ FA_RECHARGE_POINT_FLOW 충전 실행 실패', rechargeResult.error);
      return { success: false, message: rechargeResult.message || '포인트 지급 처리에 실패했습니다.' };
    }

    // 3. 신청 상태 APPROVED로 변경
    const { error: updateError } = await supabaseAdmin
      .from('point_recharge_requests')
      .update({
        status: 'APPROVED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      nvLog('FW', '⚠️ 충전 신청 테이블 상태 업데이트 에러 (포인트는 충전됨)', updateError.message);
      // 포인트가 충전되었으므로 성공으로 응답을 주되 경고 기록
    }

    // 4. 연동된 1:1 문의글이 존재할 경우 자동 답변 작성 및 완료 처리
    if (request.inquiry_id) {
      try {
        await supabaseAdmin
          .from('inquiries')
          .update({
            reply: `안녕하세요. 폭스몬 관리자입니다. 
요청하신 포인트 충전(금액: ${request.amount.toLocaleString()} 원) 건의 무통장 입금이 정상 확인되어 승인 처리가 완료되었습니다. 

포인트가 계정으로 즉시 지급 완료되었습니다. 이용해 주셔서 감사합니다.`,
            status: 'ANSWERED',
            replied_at: new Date().toISOString()
          })
          .eq('id', request.inquiry_id);
      } catch (inqErr: any) {
        nvLog('FW', '⚠️ 연동된 문의글 자동 답변 등록 실패 (승인)', inqErr.message);
      }
    }

    revalidatePath('/cs');
    return { 
      success: true, 
      message: `승인이 완료되었습니다. ${rechargeResult.message}` 
    };
  } catch (err: any) {
    nvLog('FW', '❌ 무통장 입금 승인 중 예외 발생', err.message);
    return { success: false, message: '승인 처리 중 오류가 발생했습니다.' };
  }
}

/**
 * 무통장 입금 신청 반려(거절) 처리
 */
export async function rejectRechargeRequest(requestId: string, rejectReason?: string) {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, message: '관리자 권한이 없습니다.' };
  }

  if (!requestId) {
    return { success: false, message: '요청 ID가 누락되었습니다.' };
  }

  try {
    const { data: request } = await supabaseAdmin
      .from('point_recharge_requests')
      .select('status, inquiry_id, amount')
      .eq('id', requestId)
      .single();

    if (!request) {
      return { success: false, message: '충전 신청 내역을 찾을 수 없습니다.' };
    }

    if (request.status !== 'PENDING') {
      return { success: false, message: '대기 중인 신청 건만 반려할 수 있습니다.' };
    }

    const { error } = await supabaseAdmin
      .from('point_recharge_requests')
      .update({
        status: 'REJECTED',
        reject_reason: rejectReason?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      nvLog('FW', '❌ 충전 반려 상태 변경 실패', error.message);
      return { success: false, message: '반려 처리에 실패했습니다.' };
    }

    // 4. 연동된 1:1 문의글이 존재할 경우 자동 답변(반려 사유) 작성 및 완료 처리
    if (request && request.inquiry_id) {
      try {
        await supabaseAdmin
          .from('inquiries')
          .update({
            reply: `안녕하세요. 폭스몬 관리자입니다. 
요청하신 포인트 충전(금액: ${Number(request.amount || 0).toLocaleString()} 원) 건이 반려되었습니다.

[반려 사유]
${rejectReason?.trim() || '입금자명 불일치 또는 금액 상이'}

내용을 확인하신 후 다시 신청해 주시기 바랍니다.`,
            status: 'ANSWERED',
            replied_at: new Date().toISOString()
          })
          .eq('id', request.inquiry_id);
      } catch (inqErr: any) {
        nvLog('FW', '⚠️ 연동된 문의글 자동 답변 등록 실패 (반려)', inqErr.message);
      }
    }

    revalidatePath('/cs');
    return { success: true, message: '정상적으로 반려 처리되었습니다.' };
  } catch (err: any) {
    nvLog('FW', '❌ 충전 반려 처리 오류', err.message);
    return { success: false, message: '반려 처리 중 오류가 발생했습니다.' };
  }
}
