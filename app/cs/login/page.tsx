import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import CsLoginClient from './CsLoginClient';

export const dynamic = 'force-dynamic';

export default async function CsLoginPage() {
  // 1. 기기 승인 선행 검사
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get('cs_device_token')?.value;

  if (!deviceToken) {
    redirect('/cs/unauthorized');
  }

  const { data: approvedDevice } = await supabaseAdmin
    .from('cs_approved_devices')
    .select('status')
    .eq('device_token', deviceToken)
    .eq('status', 'APPROVED')
    .maybeSingle();

  if (!approvedDevice) {
    redirect('/cs/unauthorized');
  }

  // 2. 이미 로그인 세션이 유효하다면 메인으로 즉시 넘김
  const sessionToken = cookieStore.get('cs_session_token')?.value;
  if (sessionToken && sessionToken.startsWith('CS_SESSION_')) {
    redirect('/cs');
  }

  return <CsLoginClient />;
}
