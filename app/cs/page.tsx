import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import CsDashboardClient from './CsDashboardClient';

export const dynamic = 'force-dynamic';

export default async function CsPage() {
  const cookieStore = await cookies();
  
  // 1. 기기 승인 검증 (쿠키 기반)
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

  // 2. CS 독자 세션 검증 (쿠키 기반)
  const sessionToken = cookieStore.get('cs_session_token')?.value;
  if (!sessionToken || !sessionToken.startsWith('CS_SESSION_')) {
    redirect('/cs/login');
  }

  // 3. 문의 및 무통장 신청 목록 조회
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

  // 매핑 처리
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
      <div className="max-w-md mx-auto">
        <CsDashboardClient initialInquiries={inquiries} initialRecharges={recharges} />
      </div>
    </div>
  );
}
