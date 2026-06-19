import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { nvLog } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;

    // RLS 우회하여 안전하게 activity_points 잔액 조회
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('activity_points')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw error || new Error('사용자 정보를 찾을 수 없습니다.');
    }

    return NextResponse.json({
      success: true,
      balance: user.activity_points || 0
    });

  } catch (err: any) {
    nvLog('FW', '포인트 잔액 조회 서버 에러', err.message);
    return NextResponse.json({ success: false, message: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}
