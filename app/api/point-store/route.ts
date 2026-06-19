import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

// 상품권 신청
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { giftCardType, amount } = body; // 'CULTURE_LAND' | 'HAPPY_MONEY' | 'GOOGLE_PLAY', 금액(BigInt형)

    if (!giftCardType || !amount || amount < 5000) {
      return NextResponse.json({ success: false, message: '신청 정보가 올바르지 않거나 최소 신청 금액(5,000포인트)에 미달합니다.' }, { status: 400 });
    }

    nvLog('FW', '상품권 교환 신청 시도', { userId, giftCardType, amount });

    // Supabase RPC 호출로 원자적 트랜잭션 수행
    const { data: rpcResult, error: rpcError } = await supabaseAdmin
      .rpc('request_gift_card_redemption', {
        p_user_id: userId,
        p_gift_card_type: giftCardType,
        p_amount: amount
      });

    if (rpcError || !rpcResult?.success) {
      nvLog('FW', '상품권 교환 신청 실패', { rpcError, rpcResult });
      return NextResponse.json({ 
        success: false, 
        message: rpcResult?.message || '포인트가 부족하거나 신청 처리 중 오류가 발생했습니다.' 
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '상품권 교환 신청이 완료되었습니다. 관리자 심사 후 지급됩니다.',
      balanceAfter: rpcResult.balance_after
    });

  } catch (err: any) {
    nvLog('FW', '상품권 신청 서버 오류', err.message);
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
