import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import CsDashboardClient from './CsDashboardClient';

export const dynamic = 'force-dynamic';

export default async function CsPage() {
  const cookieStore = await cookies();
  
  // 1. CS 독자 세션 검증 (쿠키 기반)
  const sessionToken = cookieStore.get('cs_session_token')?.value;
  if (!sessionToken || !sessionToken.startsWith('CS_SESSION_')) {
    redirect('/cs/login');
  }

  // 2. 기기 승인 검증 (쿠키 기반)
  const deviceToken = cookieStore.get('cs_device_token')?.value;
  if (!deviceToken) {
    redirect('/cs/login');
  }

  const { data: approvedDevice } = await supabaseAdmin
    .from('cs_approved_devices')
    .select('status')
    .eq('device_token', deviceToken)
    .eq('status', 'APPROVED')
    .maybeSingle();

  if (!approvedDevice) {
    redirect('/cs/login');
  }

  // 3. 관리자 유저 정보 조회 (로그아웃 버튼 옆 로그인 아이디 표기용)
  const adminUserId = sessionToken.split('_')[2] || '';
  const { data: adminUser } = await supabaseAdmin
    .from('users')
    .select('login_id, nickname')
    .eq('id', adminUserId)
    .maybeSingle();

  // 4. 문의, 무통장 신청 목록 조회 (조인 실패에 대처하기 위해 분리 쿼리 적용)
  const { data: rawInquiries } = await supabaseAdmin
    .from('inquiries')
    .select('id, category, title, content, status, reply, replied_at, created_at, user_id')
    .order('created_at', { ascending: false });

  const { data: rawRecharges } = await supabaseAdmin
    .from('point_recharge_requests')
    .select('id, amount, depositor_name, status, created_at, user_id')
    .order('created_at', { ascending: false });

  // 유저 ID 수집
  const userIds = new Set<string>();
  (rawInquiries || []).forEach(x => { if (x.user_id) userIds.add(x.user_id); });
  (rawRecharges || []).forEach(x => { if (x.user_id) userIds.add(x.user_id); });

  // 유저 정보 메모리 상의 대량 일괄 조회
  const userMap: Record<string, { nickname: string; email: string }> = {};
  if (userIds.size > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, nickname, email')
      .in('id', Array.from(userIds));

    (users || []).forEach(u => {
      userMap[u.id] = {
        nickname: u.nickname || '닉네임 없음',
        email: u.email || '이메일 없음'
      };
    });
  }

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
    userNickname: userMap[inq.user_id]?.nickname || '닉네임 없음',
    userEmail: userMap[inq.user_id]?.email || '이메일 없음',
  }));

  const recharges = (rawRecharges || []).map((rec: any) => ({
    id: rec.id,
    amount: rec.amount,
    depositorName: rec.depositor_name,
    status: rec.status,
    createdAt: rec.created_at,
    userId: rec.user_id,
    userNickname: userMap[rec.user_id]?.nickname || '닉네임 없음',
    userEmail: userMap[rec.user_id]?.email || '이메일 없음',
  }));

  const adminName = adminUser?.nickname || adminUser?.login_id || 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 py-6 px-4 md:px-8">
      {/* PC 접속 시 모바일이 아닌 넓은 PC 스크린에 최적화되도록 w-full 및 md:max-w-6xl 분기 지원 */}
      <div className="max-w-md md:max-w-6xl mx-auto w-full">
        <CsDashboardClient 
          initialInquiries={inquiries} 
          initialRecharges={recharges} 
          csAdminUserId={adminUserId}
          csAdminName={adminName}
        />
      </div>
    </div>
  );
}
