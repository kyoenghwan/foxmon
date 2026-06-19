import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { QA_VERIFY_USER_CI } from '@/src/atoms/qa/auth/QA_VERIFY_USER_CI';
import { OA_RESET_PASSWORD } from '@/src/atoms/oa/auth/OA_RESET_PASSWORD';
import { OA_CREATE_RESET_TOKEN } from '@/src/atoms/oa/auth/OA_CREATE_RESET_TOKEN';
import { sendResetPasswordEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1) 본인인증으로 비밀번호 재설정 — CI 검증 후 즉시 변경
    if (action === 'verify-and-reset') {
      const { loginId, ci, newPassword } = body;
      if (!loginId || !ci || !newPassword) {
        return NextResponse.json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 });
      }

      const verifyResult = await QA_VERIFY_USER_CI(loginId, ci);
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

    // 2) 이메일로 비밀번호 재설정 링크 발송
    if (action === 'send-reset-link') {
      const { loginId, email } = body;
      if (!loginId || !email) {
        return NextResponse.json({ success: false, message: '아이디와 이메일을 모두 입력해주세요.' }, { status: 400 });
      }

      // 아이디 + 이메일 일치 확인
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, name, email')
        .eq('login_id', loginId)
        .eq('email', email)
        .single();

      // 보안상 동일 메시지 반환 (계정 존재 여부 노출 방지)
      if (error || !user) {
        return NextResponse.json({
          success: true,
          message: '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.',
        });
      }

      // 토큰 생성
      const tokenResult = await OA_CREATE_RESET_TOKEN(user.id);
      if (!tokenResult.success || !tokenResult.token) {
        return NextResponse.json({ success: false, message: '재설정 링크 생성 중 오류가 발생했습니다.' }, { status: 500 });
      }

      // 이메일 발송
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://foxmon.co.kr';
      const resetUrl = `${siteUrl}/reset-password/${tokenResult.token}`;
      await sendResetPasswordEmail(email, user.name, resetUrl);

      return NextResponse.json({
        success: true,
        message: '입력하신 이메일로 비밀번호 재설정 링크를 발송했습니다.',
      });
    }

    // 3) 토큰으로 비밀번호 재설정 (이메일 링크 클릭 후)
    if (action === 'reset-with-token') {
      const { token, newPassword } = body;
      if (!token || !newPassword) {
        return NextResponse.json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 });
      }

      const { OA_VERIFY_RESET_TOKEN } = await import('@/src/atoms/oa/auth/OA_CREATE_RESET_TOKEN');
      const verifyResult = await OA_VERIFY_RESET_TOKEN(token);
      if (!verifyResult.success || !verifyResult.userId) {
        return NextResponse.json({ success: false, message: verifyResult.error || '유효하지 않은 링크입니다.' }, { status: 400 });
      }

      const resetResult = await OA_RESET_PASSWORD(verifyResult.userId, newPassword);
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
