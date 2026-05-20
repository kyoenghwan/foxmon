import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSiteSettings } from '@/actions/admin/siteSettings';
import { isAdminRole } from '@/lib/normalize-user-role';

export async function GET() {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; staff_team?: string; login_id?: string }
    | undefined;

  if (!user?.id) {
    return NextResponse.json({ eligible: false, csAdminUserId: null });
  }

  const loginId = String(user.login_id || '').trim().toLowerCase();
  const isCsOpsAccount = loginId.startsWith('foxmon_');

  if (!isAdminRole(user.role) && !isCsOpsAccount) {
    return NextResponse.json({ eligible: false, csAdminUserId: null });
  }

  const settings = await getSiteSettings();
  const csAdminUserId =
    (settings.success && settings.data?.cs_admin_user_id?.trim()) || null;

  return NextResponse.json({
    eligible: true,
    csAdminUserId: csAdminUserId || user.id,
  });
}
