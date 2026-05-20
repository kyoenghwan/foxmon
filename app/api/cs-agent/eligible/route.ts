import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSiteSettings } from '@/actions/admin/siteSettings';

export async function GET() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; staff_team?: string; login_id?: string }
    | undefined;

  if (!user?.id) {
    return NextResponse.json({ eligible: false, csAdminUserId: null });
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ eligible: false, csAdminUserId: null });
  }

  const settings = await getSiteSettings();
  const csAdminUserId =
    (settings.success && settings.data?.cs_admin_user_id?.trim()) || null;

  const loginId = String(user.login_id || '').toLowerCase();
  const eligible =
    user.staff_team === 'CS' ||
    loginId.startsWith('foxmon_') ||
    (!!csAdminUserId && user.id === csAdminUserId);

  return NextResponse.json({
    eligible,
    csAdminUserId: csAdminUserId || user.id,
  });
}
