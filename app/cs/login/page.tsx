import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CsLoginClient from './CsLoginClient';

export const dynamic = 'force-dynamic';

export default async function CsLoginPage() {
  // 1. 이미 로그인 세션이 유효하다면 메인 CS 웹앱으로 즉시 넘김
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('cs_session_token')?.value;
  if (sessionToken && sessionToken.startsWith('CS_SESSION_')) {
    redirect('/cs');
  }

  // 2. 기기 등록 여부는 로그인 카드 화면 내부에 결합하여 표시하므로, 바로 로그인 클라이언트 렌더링
  return <CsLoginClient />;
}
