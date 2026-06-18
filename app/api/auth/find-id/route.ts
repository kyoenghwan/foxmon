import { NextResponse } from 'next/server';
import { QA_FIND_USER_BY_CI } from '@/src/atoms/qa/auth/QA_FIND_USER_BY_CI';
import { QA_FIND_USER_BY_NAME_EMAIL } from '@/src/atoms/qa/auth/QA_FIND_USER_BY_NAME_EMAIL';
import { sendFindIdEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { method } = body; // 'phone' | 'email'

    if (method === 'phone') {
      // 본인인증으로 아이디 찾기 — CI로 조회
      const { ci } = body;
      if (!ci) {
        return NextResponse.json({ success: false, message: 'CI 정보가 없습니다.' }, { status: 400 });
      }

      const result = await QA_FIND_USER_BY_CI(ci);
      if (result.error) {
        return NextResponse.json({ success: false, message: '조회 중 오류가 발생했습니다.' }, { status: 500 });
      }

      if (!result.data || result.data.length === 0) {
        return NextResponse.json({ success: false, message: '가입된 아이디가 없습니다.' });
      }

      return NextResponse.json({
        success: true,
        accounts: result.data.map(u => ({
          loginId: u.login_id,
          createdAt: u.created_at,
        })),
      });

    } else if (method === 'email') {
      // 이메일로 아이디 찾기 — 이름 + 이메일로 조회 후 마스킹하여 이메일 발송
      const { name, email } = body;
      if (!name || !email) {
        return NextResponse.json({ success: false, message: '이름과 이메일을 모두 입력해주세요.' }, { status: 400 });
      }

      const result = await QA_FIND_USER_BY_NAME_EMAIL(name, email);
      if (result.error || !result.data || result.data.length === 0) {
        // 보안상 가입 여부를 노출하지 않고 동일한 메시지 반환
        return NextResponse.json({
          success: true,
          message: '입력하신 이메일로 아이디 정보를 발송했습니다.',
        });
      }

      // 이메일 발송
      await sendFindIdEmail(email, name, result.data);

      return NextResponse.json({
        success: true,
        message: '입력하신 이메일로 아이디 정보를 발송했습니다.',
      });
    }

    return NextResponse.json({ success: false, message: '지원하지 않는 방식입니다.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: `서버 오류: ${err.message}` }, { status: 500 });
  }
}
