import { normalizeDbEnum, isAdminRole } from '@/lib/normalize-user-role';

export type HelpCenterUser = {
  id?: string;
  role?: string | null;
  login_id?: string | null;
  staff_team?: string | null;
};

/** 고객센터 콘텐츠·1:1 문의 답변 등 운영 권한 */
export function canManageHelpCenter(user?: HelpCenterUser | null): boolean {
  if (!user?.id) return false;
  if (isAdminRole(user.role)) return true;

  const loginId = String(user.login_id || '').trim().toLowerCase();
  if (loginId.startsWith('foxmon_')) return true;

  const team = normalizeDbEnum(user.staff_team);
  if (team === 'CS' || team === 'OPS') return true;

  return false;
}

/** FOX OFFICE 전체(대시보드·회원관리 등) — 시스템 관리자만 */
export function canAccessFoxOfficeAdmin(user?: HelpCenterUser | null): boolean {
  return isAdminRole(user?.role);
}

/** FOX OFFICE 중 고객센터·상담 관련 경로 */
export function canAccessFoxOfficeSupportRoutes(user?: HelpCenterUser | null): boolean {
  return canManageHelpCenter(user);
}

export function isFoxOfficeSupportPath(pathname: string): boolean {
  return (
    pathname.startsWith('/fox-office/help') ||
    pathname.startsWith('/fox-office/support')
  );
}
