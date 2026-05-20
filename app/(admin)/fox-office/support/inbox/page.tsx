import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Headset, ArrowLeft } from 'lucide-react';
import { getSiteSettings } from '@/actions/admin/siteSettings';
import { listCsRoomsForAdmin } from '@/actions/admin/csMessenger';
import { CsMessengerInbox } from '@/components/admin/CsMessengerInbox';

export default async function CsMessengerInboxPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
    redirect('/');
  }

  const [roomsRes, settingsRes] = await Promise.all([listCsRoomsForAdmin(), getSiteSettings()]);
  const rooms = roomsRes.success ? roomsRes.data || [] : [];
  const csAdminUserId =
    (settingsRes.success && settingsRes.data?.cs_admin_user_id) || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/fox-office/support/staff"
          className="inline-flex items-center gap-1 text-[13px] font-bold text-gray-500 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          담당자 관리
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Headset className="w-6 h-6 text-primary" />
          고객센터 메신저
        </h2>
        <p className="text-[13px] text-gray-500 font-medium mt-1">
          고객이 위젯에서 남긴 문의를 확인하고 답변합니다. 고객 화면에는 실시간으로 표시됩니다.
        </p>
      </div>

      {!roomsRes.success && roomsRes.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-800">
          {roomsRes.error}
        </div>
      ) : null}

      <CsMessengerInbox csAdminUserId={csAdminUserId} />
    </div>
  );
}
