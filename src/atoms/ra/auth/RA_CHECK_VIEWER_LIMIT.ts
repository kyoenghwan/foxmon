import { isViewerRole } from '@/lib/normalize-user-role';

/**
 * RA_CHECK_VIEWER_LIMIT: 현재 사용자가 뷰어 역할인지 확인하고, 뷰어인 경우 쓰기 작업을 차단합니다.
 * Domain: Auth
 * Type: Rule Atom
 */
export const RA_CHECK_VIEWER_LIMIT = (role?: string | null) => {
  if (isViewerRole(role)) {
    return { isAllowed: false, error: '뷰어 계정은 조회만 가능하며, 등록/수정/삭제 작업을 수행할 수 없습니다.' };
  }
  return { isAllowed: true, error: null };
};
