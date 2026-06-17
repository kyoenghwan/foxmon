/** DB·CSV에서 들어온 role/staff_team 등 enum 문자열 정리 */
export function normalizeDbEnum(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '');
}

export function isAdminRole(role?: string | null): boolean {
  const r = normalizeDbEnum(role);
  return r === 'ADMIN' || r === 'SUPER_ADMIN';
}

export function isViewerRole(role?: string | null): boolean {
  return normalizeDbEnum(role) === 'VIEWER';
}
