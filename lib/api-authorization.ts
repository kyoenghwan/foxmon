import { auth } from '@/auth';
import { isSupabaseServiceRoleConfigured, supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';

/** 운영 보정은 동일 출처의 관리자 요청에서만 실행합니다. */
export async function requireMaintenanceAdmin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ success: false, error: '허용되지 않은 출처입니다.' }, { status: 403 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
  }
  if (!isSupabaseServiceRoleConfigured) {
    return NextResponse.json({ success: false, error: '서버 권한 설정을 확인해주세요.' }, { status: 503 });
  }
  const { data, error } = await supabaseAdmin.from('users').select('role').eq('id', session.user.id).single();
  if (error) return NextResponse.json({ success: false, error: '관리자 권한 확인에 실패했습니다.' }, { status: 503 });
  if (!data || !['ADMIN', 'SUPER_ADMIN'].includes(data.role)) {
    return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 403 });
  }
  return null;
}

export function requireCronAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret?.trim()) {
    return NextResponse.json({ success: false, error: 'Cron 인증 설정이 필요합니다.' }, { status: 503 });
  }
  const actual = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret}`);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 });
  }
  return null;
}
