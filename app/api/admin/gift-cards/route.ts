import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

// 1. 상품권 신청 전체 목록 조회 (어드민 전용)
export async function GET(req: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '권한이 없습니다.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ALL'; // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

    nvLog('FW', '어드민 상품권 신청 목록 조회', { adminId: session?.user?.id, status });

    // 1차: join 포함 조회 시도
    let query = supabaseAdmin
      .from('gift_card_requests')
      .select('*, users(login_id, nickname)')
      .order('created_at', { ascending: false });

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    let { data: requests, error } = await query;

    // join 실패 시 join 없이 재시도
    if (error) {
      nvLog('FW', '어드민 상품권 조회 join 실패 → join 없이 재시도', error.message);
      
      let fallbackQuery = supabaseAdmin
        .from('gift_card_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (status !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('status', status);
      }

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) throw fallbackError;

      // user 정보를 별도 조회하여 매핑
      if (fallbackData && fallbackData.length > 0) {
        const userIds = [...new Set(fallbackData.map((r: any) => r.user_id))];
        const { data: usersData } = await supabaseAdmin
          .from('users')
          .select('id, login_id, nickname')
          .in('id', userIds);

        const userMap: Record<string, any> = {};
        usersData?.forEach((u: any) => { userMap[u.id] = u; });

        requests = fallbackData.map((r: any) => ({
          ...r,
          users: userMap[r.user_id] ? { login_id: userMap[r.user_id].login_id, nickname: userMap[r.user_id].nickname } : null
        }));
      } else {
        requests = fallbackData || [];
      }
    }

    return NextResponse.json({
      success: true,
      list: requests || []
    });

  } catch (err: any) {
    nvLog('FW', '어드민 상품권 신청 조회 에러', err.message);
    return NextResponse.json({ success: false, message: '목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

// 2. 신청 승인 및 반려 처리 (어드민 전용)
export async function POST(req: Request) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role;
    const adminId = session?.user?.id;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: '권한이 없습니다.' }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, action, pinNumber } = body; // action: 'APPROVE' | 'REJECT', pinNumber: string

    if (!requestId || !action) {
      return NextResponse.json({ success: false, message: '요청 파라미터가 유효하지 않습니다.' }, { status: 400 });
    }

    nvLog('FW', '어드민 상품권 처리 실행', { adminId, requestId, action, hasPin: !!pinNumber });

    // 1. 해당 신청 건 조회 및 락 (상태 확인)
    const { data: request, error: findError } = await supabaseAdmin
      .from('gift_card_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (findError || !request) {
      return NextResponse.json({ success: false, message: '존재하지 않는 신청 건입니다.' }, { status: 404 });
    }

    if (request.status !== 'PENDING') {
      return NextResponse.json({ success: false, message: '이미 처리가 완료된 건입니다.' }, { status: 400 });
    }

    if (action === 'APPROVE') {
      if (!pinNumber || pinNumber.trim() === '') {
        return NextResponse.json({ success: false, message: '상품권 승인을 위해서는 핀 번호(PIN)를 입력해야 합니다.' }, { status: 400 });
      }

      // 1) 승인 처리 (핀번호 포함)
      const { error: updateError } = await supabaseAdmin
        .from('gift_card_requests')
        .update({
          status: 'APPROVED',
          pin_number: pinNumber.trim(),
          processed_at: new Date().toISOString(),
          processed_by: adminId
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 2) 유저 포인트 거래 원장에 핀번호 업데이트 및 상세내역 교정
      try {
        const { data: lastTx, error: txError } = await supabaseAdmin
          .from('activity_point_transactions')
          .select('id, description')
          .eq('user_id', request.user_id)
          .eq('type', 'GIFT_CARD_REQUEST')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!txError && lastTx && lastTx.length > 0) {
          const originalDesc = lastTx[0].description || '';
          const newDesc = originalDesc.replace('신청 차감', '승인 완료').replace('신청차감', '승인완료');
          
          await supabaseAdmin
            .from('activity_point_transactions')
            .update({
              pin_number: pinNumber.trim(),
              description: `${newDesc} (PIN: ${pinNumber.trim()})`
            })
            .eq('id', lastTx[0].id);
        }
      } catch (txErr: any) {
        nvLog('FW', '⚠️ 상품권 승인 원장 이력 업데이트 실패 (비치명적)', txErr.message);
      }

      return NextResponse.json({ success: true, message: '승인 및 상품권 지급이 완료되었습니다.' });

    } else if (action === 'REJECT') {
      // 반려 처리 (가장 중요: 사용자의 포인트를 롤백 반환해 줌)
      const { error: updateError } = await supabaseAdmin
        .from('gift_card_requests')
        .update({
          status: 'REJECTED',
          processed_at: new Date().toISOString(),
          processed_by: adminId
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 포인트 복구 (RPC 호출로 원자적 롤백 수행)
      const { data: rpcResult, error: rpcError } = await supabaseAdmin
        .rpc('process_activity_point', {
          p_user_id: request.user_id,
          p_type: 'ADMIN_ADJUST',
          p_amount: request.amount, // 차감했던 신청 포인트를 다시 더함 (+)
          p_description: `상품권 신청 반려에 따른 포인트 환불 반환 (신청번호: ${requestId})`
        });

      if (rpcError || !rpcResult?.success) {
        nvLog('FW', '⚠️ 상품권 반려에 따른 포인트 롤백 실패', rpcError?.message);
        return NextResponse.json({ 
          success: true, 
          message: '반려 처리는 접수되었으나 포인트 복구 작업 중 일시적인 오류가 발생했습니다. 확인 바랍니다.' 
        });
      }

      return NextResponse.json({ success: true, message: '반려 및 포인트 환불 처리가 완료되었습니다.' });
    }

    return NextResponse.json({ success: false, message: '지원하지 않는 액션입니다.' }, { status: 400 });

  } catch (err: any) {
    nvLog('FW', '어드민 상품권 승인/반려 서버 에러', err.message);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
