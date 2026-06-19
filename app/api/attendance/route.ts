import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

// 1. 이번 달 출석 현황 조회
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;

    // 현재 년/월 기준 출석 이력 조회
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`; // SQL 비교 시 알아서 처리됨

    const { data: logs, error } = await supabaseAdmin
      .from('attendance_logs')
      .select('attendance_date')
      .eq('user_id', userId)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      dates: (logs || []).map(l => l.attendance_date)
    });
  } catch (err: any) {
    nvLog('FW', '출석현황 조회 에러', err.message);
    return NextResponse.json({ success: false, message: '출석 현황을 불러오지 못했습니다.' }, { status: 500 });
  }
}

// 2. 출석 체크 실행 및 포인트 적립
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;

    // KST(한국 표준시) 기준 오늘 날짜 구하기 (서버 시간 편차 방지)
    const kstDateStr = new Date(new Date().getTime() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];

    nvLog('FW', '출석체크 시도', { userId, kstDateStr });

    // 1. 출석 기록 인서트 (유니크 제약조건으로 동시 요청 시도 원천 차단)
    const { error: insertError } = await supabaseAdmin
      .from('attendance_logs')
      .insert([
        {
          user_id: userId,
          attendance_date: kstDateStr
        }
      ]);

    if (insertError) {
      // 23505: PostgreSQL Unique Violation (이미 출석함)
      if (insertError.code === '23505') {
        return NextResponse.json({ success: false, message: '오늘 이미 출석체크를 완료하셨습니다.' }, { status: 400 });
      }
      throw insertError;
    }

    // 2. 포인트 적립 RPC 실행 (+100 포인트)
    const { data: rpcResult, error: rpcError } = await supabaseAdmin
      .rpc('process_activity_point', {
        p_user_id: userId,
        p_type: 'ATTENDANCE',
        p_amount: 100,
        p_description: `${kstDateStr} 일일 출석체크 보너스 적립`
      });

    if (rpcError || !rpcResult?.success) {
      nvLog('FW', '출석체크 포인트 적립 에러 (기록은 저장됨)', rpcError?.message);
      // 포인트 적립 실패 시에도 출석 기록은 트랜잭션 롤백하지 않고 오류 상황만 알림 (수동 지급 조치 대상)
      return NextResponse.json({ 
        success: true, 
        message: '출석체크는 완료되었으나 포인트 지급 중 일시적인 오류가 발생했습니다. 관리자에게 문의바랍니다.' 
      });
    }

    return NextResponse.json({
      success: true,
      message: '출석체크 완료! 100포인트가 적립되었습니다.',
      balanceAfter: rpcResult.balance_after
    });

  } catch (err: any) {
    nvLog('FW', '출석체크 내부 서버 에러', err.message);
    return NextResponse.json({ success: false, message: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}
