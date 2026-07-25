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
      return { success: false, message: rechargeResult.error || rechargeResult.message || '포인트 지급 처리에 실패했습니다.' };
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
            reply: '포인트 충전이 완료 되었습니다.',
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

/**
 * 1:1 고객 문의 AI 자동 답변 생성 (Gemini 또는 OpenAI 이용)
 */
export async function generateAiReply(payload: { inquiryId: string }): Promise<{ success: boolean; replyText?: string; message?: string }> {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, message: '관리자 권한이 없습니다.' };
  }

  const inquiryId = payload.inquiryId;
  if (!inquiryId) {
    return { success: false, message: '문의 ID가 누락되었습니다.' };
  }

  try {
    // 1. 문의글 정보 조회
    const { data: inquiry, error: inqErr } = await supabaseAdmin
      .from('inquiries')
      .select('title, content')
      .eq('id', inquiryId)
      .single();

    if (inqErr || !inquiry) {
      return { success: false, message: '문의 내용을 찾을 수 없습니다.' };
    }

    // 2. 외부 API 키 조회 (site_settings)
    const { data: settings } = await supabaseAdmin
      .from('site_settings')
      .select('key_name, key_value')
      .in('key_name', ['gemini_api_key', 'openai_api_key']);

    const settingsMap = (settings || []).reduce((acc, row) => {
      acc[row.key_name] = row.key_value;
      return acc;
    }, {} as Record<string, string>);

    const geminiApiKey = settingsMap['gemini_api_key']?.trim();
    const openaiApiKey = settingsMap['openai_api_key']?.trim();

    if (!geminiApiKey && !openaiApiKey) {
      return { 
        success: false, 
        message: 'Google Gemini API Key 또는 OpenAI API Key를 [시스템 설정]에 먼저 등록해 주세요.' 
      };
    }

    const systemInstruction = `당신은 구인구직 및 커뮤니티 플랫폼 '폭스몬'의 고객센터 전문 CS 상담사입니다. 회원의 1:1 문의 내용을 바탕으로, 매우 공손하고 정중하며 친절하게 도움이 되는 답변 초안을 한국어로 작성해 주세요. 
반드시 문체는 정중한 경어체(~입니다, ~해 드리겠습니다)를 사용해야 합니다.
답변 글자 이외의 어떠한 서론이나 설명, 메타 정보 등은 출력하지 마십시오. 오직 고객에게 보낼 최종 답변 본문만 응답하세요.`;

    const userPrompt = `[문의 제목]\n${inquiry.title}\n\n[문의 내용]\n${inquiry.content}`;

    // 1순위: Google Gemini API (무료 플랜 지원)
    if (geminiApiKey) {
      nvLog('FW', '🤖 Gemini API를 사용하여 CS 답변 생성 시도...');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }]
          }]
        })
      });

      const resJson = await response.json();
      const aiText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiText) {
        return { success: true, replyText: aiText.trim() };
      } else {
        nvLog('FW', '⚠️ Gemini 응답 해석 실패. OpenAI 폴백 시도...', resJson);
      }
    }

    // 2순위: OpenAI GPT-4o-mini (과금 저렴)
    if (openaiApiKey) {
      nvLog('FW', '🤖 OpenAI API (gpt-4o-mini)를 사용하여 CS 답변 생성 시도...');
      const url = 'https://api.openai.com/v1/chat/completions';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      const resJson = await response.json();
      const aiText = resJson.choices?.[0]?.message?.content;

      if (aiText) {
        return { success: true, replyText: aiText.trim() };
      }
    }

    return { success: false, message: 'AI 답변 생성에 실패했습니다. API 키 상태를 확인해 주세요.' };
  } catch (err: any) {
    nvLog('FW', '❌ AI 답변 생성 예외 발생', err.message);
    return { success: false, message: `답변 생성 중 오류가 발생했습니다. (${err.message})` };
  }
}

/**
 * CS 답변 템플릿(자주 쓰는 답변) 조회
 */
export async function getCsTemplates(): Promise<{ success: boolean; templates: Array<{ id: string; title: string; content: string; category: string }> }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cs_templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { success: true, templates: data || [] };
  } catch (err: any) {
    // cs_templates 테이블이 아직 없거나 로드가 안 될 때의 안전한 폴백 매크로 리스트
    const fallbacks = [
      { id: 'fb1', title: '입금자명 불일치', content: '신청하신 입금자명과 실제 통장 입금자명이 달라 확인이 어렵습니다. 입금자명을 다시 확인하신 후 신청해 주세요.', category: 'RECHARGE_REJECT' },
      { id: 'fb2', title: '신청금액 불일치', content: '신청하신 금액과 실제 통장에 송금된 금액이 일치하지 않아 반려되었습니다. 보낸 금액을 확인하신 후 재신청 부탁드립니다.', category: 'RECHARGE_REJECT' },
      { id: 'fb3', title: '입금 내역 확인불가', content: '송금 완료 시간이 오래 경과되었거나 해당 입금 내역이 통장에 존재하지 않습니다. 입금 일시 및 송금 정보를 다시 확인해 주세요.', category: 'RECHARGE_REJECT' },
      { id: 'fb4', title: '인증 서류 반려 안내', content: '제출해주신 신분증/사업자증 서류의 상태가 흐리거나 식별하기 곤란하여 보류되었습니다. 선명한 촬영 사진으로 재등록해 주세요.', category: 'INQUIRY_REPLY' },
      { id: 'fb5', title: '광고 규정 준수 보류', content: '제출하신 광고 신청 글에 광고 등록 운영 규정에 저촉되는 문구(예: 과대광고, 금지어)가 포함되어 있습니다. 수정 후 재신청 바랍니다.', category: 'INQUIRY_REPLY' }
    ];
    return { success: true, templates: fallbacks };
  }
}

/**
 * CS 답변 템플릿 추가
 */
export async function addCsTemplate(payload: { title: string; content: string; category: string; inquiry_category?: string }): Promise<{ success: boolean; message: string }> {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, message: '관리자 권한이 없습니다.' };
  }

  const { title, content, category, inquiry_category } = payload;
  if (!title?.trim() || !content?.trim() || !category?.trim()) {
    return { success: false, message: '제목, 내용, 카테고리는 필수 입력 항목입니다.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('cs_templates')
      .insert({
        title: title.trim(),
        content: content.trim(),
        category: category.trim(),
        inquiry_category: inquiry_category?.trim() || null
      });

    if (error) throw error;
    revalidatePath('/cs');
    revalidatePath('/fox-office/support/staff');
    return { success: true, message: '템플릿이 성공적으로 등록되었습니다.' };
  } catch (err: any) {
    nvLog('FW', '❌ 템플릿 등록 실패', err.message);
    return { success: false, message: `템플릿 등록 중 오류가 발생했습니다. (${err.message})` };
  }
}

/**
 * CS 답변 템플릿 삭제
 */
export async function deleteCsTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
  const adminCheck = await verifyAdminPermission();
  if (!adminCheck.success) {
    return { success: false, message: '관리자 권한이 없습니다.' };
  }

  if (!templateId) {
    return { success: false, message: '템플릿 ID가 누락되었습니다.' };
  }

  try {
    const { error } = await supabaseAdmin
      .from('cs_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
    revalidatePath('/cs');
    revalidatePath('/fox-office/support/staff');
    return { success: true, message: '템플릿이 삭제되었습니다.' };
  } catch (err: any) {
    nvLog('FW', '❌ 템플릿 삭제 실패', err.message);
    return { success: false, message: `템플릿 삭제 중 오류가 발생했습니다. (${err.message})` };
  }
}
