import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import CsDashboardClient from '@/app/(admin)/fox-office/cs/CsDashboardClient';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function CsDashboardPage() {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  // 관리자 권한 차단
  if (!session?.user?.id || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
    redirect('/');
  }

  // 2. CS 기기 인증 차단 검사 (쿠키 기반)
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get('cs_device_token')?.value;

  if (!deviceToken) {
    redirect('/fox-office/cs/unauthorized');
  }

  const { data: approvedDevice } = await supabaseAdmin
    .from('cs_approved_devices')
    .select('status')
    .eq('device_token', deviceToken)
    .eq('status', 'APPROVED')
    .maybeSingle();

  if (!approvedDevice) {
    redirect('/fox-office/cs/unauthorized');
  }

  // 1. 1:1 고객 문의 목록 조회 (닉네임, 이메일 정보 조인)
  const { data: rawInquiries } = await supabaseAdmin
    .from('inquiries')
    .select(`
      id,
      category,
      title,
      content,
      status,
      reply,
      replied_at,
      created_at,
      user_id,
      users (nickname, email)
    `)
    .order('created_at', { ascending: false });

  // 2. 무통장 입금 신청 목록 조회 (닉네임, 이메일 정보 조인)
  const { data: rawRecharges } = await supabaseAdmin
    .from('point_recharge_requests')
    .select(`
      id,
      amount,
      depositor_name,
      status,
      created_at,
      user_id,
      users (nickname, email)
    `)
    .order('created_at', { ascending: false });

  // 타입 안전 매핑
  const inquiries = (rawInquiries || []).map((inq: any) => ({
    id: inq.id,
    category: inq.category,
    title: inq.title,
    content: inq.content,
    status: inq.status,
    reply: inq.reply,
    repliedAt: inq.replied_at,
    createdAt: inq.created_at,
    userId: inq.user_id,
    userNickname: inq.users?.nickname || '닉네임 없음',
    userEmail: inq.users?.email || '이메일 없음',
  }));

  const recharges = (rawRecharges || []).map((rec: any) => ({
    id: rec.id,
    amount: rec.amount,
    depositorName: rec.depositor_name,
    status: rec.status,
    createdAt: rec.created_at,
    userId: rec.user_id,
    userNickname: rec.users?.nickname || '닉네임 없음',
    userEmail: rec.users?.email || '이메일 없음',
  }));

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-6 px-4 md:px-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col border-b border-gray-800 pb-4">
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            📢 폭스몬 모바일 CS 대시보드
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            컴퓨터 앞이 아니어도 터치 한 번으로 즉각 응대 가능
          </p>
        </div>

        {/* 클라이언트 대시보드 핵심 로직 연동 */}
        <CsDashboardClient initialInquiries={inquiries} initialRecharges={recharges} />
      </div>
    </div>
  );
}
