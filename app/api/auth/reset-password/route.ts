import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { QA_VERIFY_USER_CI } from '@/src/atoms/qa/auth/QA_VERIFY_USER_CI';
import { OA_RESET_PASSWORD } from '@/src/atoms/oa/auth/OA_RESET_PASSWORD';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 0) 아이디 존재 여부 1차 사전 체크 (본인인증 전 실행)
    if (action === 'check-id') {
      const { loginId } = body;
      if (!loginId || !loginId.trim()) {
        return NextResponse.json({ success: false, message: '아이디를 입력해 주세요.' }, { status: 400 });
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('login_id', loginId.trim())
        .single();

      if (error || !user) {
        return NextResponse.json({ success: false, message: '존재하지 않는 아이디입니다.' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: '존재하는 아이디입니다.' });
    }

    // 1) 본인인증 직후 소유자 2차 사전 검증 (비밀번호 변경 폼으로 넘어가기 전)
    if (action === 'verify-owner') {
      const { loginId, ci, phoneNumber } = body;
      if (!loginId) {
        return NextResponse.json({ success: false, message: '아이디 정보가 없습니다.' }, { status: 400 });
      }

      const verifyResult = await QA_VERIFY_USER_CI(loginId, ci, phoneNumber);
      if (verifyResult.error || !verifyResult.data?.verified) {
        return NextResponse.json({
          success: false,
          message: verifyResult.error || '입력하신 아이디와 본인 인증 정보가 일치하지 않습니다.',
        }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: '소유자 검증 완료' });
    }

    // 2) 본인인증 및 소유자 검증 완료 후 최종 비밀번호 재설정
    if (action === 'verify-and-reset') {
      const { loginId, ci, phoneNumber, newPassword } = body;
      if (!loginId || (!ci && !phoneNumber) || !newPassword) {
        return NextResponse.json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 });
      }

      const verifyResult = await QA_VERIFY_USER_CI(loginId, ci, phoneNumber);
      if (verifyResult.error || !verifyResult.data?.verified) {
        return NextResponse.json({
          success: false,
          message: verifyResult.error || '본인 계정이 아닙니다. 아이디와 인증 정보가 일치하지 않습니다.',
        }, { status: 400 });
      }

      const resetResult = await OA_RESET_PASSWORD(verifyResult.data.userId, newPassword);
      if (!resetResult.success) {
        return NextResponse.json({ success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
    }

    return NextResponse.json({ success: false, message: '지원하지 않는 action입니다.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: `서버 오류: ${err.message}` }, { status: 500 });
  }
}
