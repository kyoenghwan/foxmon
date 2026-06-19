import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const loginId = searchParams.get('loginId')?.trim();

    if (!loginId) {
      return NextResponse.json({ success: false, message: '아이디를 입력해주세요.' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('nickname')
      .eq('login_id', loginId)
      .single();

    if (error || !user) {
      return NextResponse.json({ success: false, message: '존재하지 않는 회원 아이디입니다.' });
    }

    return NextResponse.json({ success: true, nickname: user.nickname });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
