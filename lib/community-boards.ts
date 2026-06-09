/**
 * 커뮤니티 게시판 SSOT — 이용 대상(전체 / 여성 / 업소) 및 권한
 */

export type CommunityAudience = 'all' | 'women' | 'employer';

export type CommunityBoardDef = {
  id: string;
  label: string;
  prefix: string;
  audience: CommunityAudience;
  sectionTitle: string;
};

export const COMMUNITY_AUDIENCE_LABELS: Record<CommunityAudience, string> = {
  all: '전체 이용',
  women: '여성 회원 전용',
  employer: '업소(사업자) 전용',
};

export const COMMUNITY_BOARDS: CommunityBoardDef[] = [
  { id: 'free', label: '자유게시판', prefix: '💬자유', audience: 'all', sectionTitle: '전체 이용' },
  { id: 'tips', label: '꿀팁·노하우', prefix: '💡꿀팁', audience: 'all', sectionTitle: '전체 이용' },
  { id: 'foxtalk', label: '폭스수다', prefix: '🦊폭스수다', audience: 'women', sectionTitle: '여성 회원 전용' },
  { id: 'foxmarket', label: '폭스중고', prefix: '🛍️폭스중고', audience: 'women', sectionTitle: '여성 회원 전용' },
  { id: 'reviews', label: '업소후기', prefix: '⭐후기', audience: 'women', sectionTitle: '여성 회원 전용' },
  { id: 'secret', label: '비밀게시판', prefix: '🔒비밀', audience: 'women', sectionTitle: '여성 회원 전용' },
  { id: 'report', label: '업소제보', prefix: '🚨제보', audience: 'women', sectionTitle: '여성 회원 전용' },
  { id: 'business', label: '업소장터', prefix: '🏪업소장터', audience: 'employer', sectionTitle: '업소(사업자) 전용' },
];

const BOARD_MAP = Object.fromEntries(COMMUNITY_BOARDS.map((b) => [b.id, b])) as Record<
  string,
  CommunityBoardDef
>;

export function getCommunityBoard(boardId: string): CommunityBoardDef | undefined {
  return BOARD_MAP[boardId];
}

function normalizeRole(role?: string | null): string {
  return String(role ?? '')
    .trim()
    .replace(/\s+/g, '');
}

export function isAdminRole(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === 'ADMIN' || r === 'SUPER_ADMIN';
}

/** 목록·읽기·쓰기 접근 가능 여부 */
export function canAccessCommunityBoard(boardId: string, role?: string | null): boolean {
  const board = getCommunityBoard(boardId);
  if (!board) return false;
  const r = normalizeRole(role);
  if (isAdminRole(r)) return true;
  if (!r) return board.audience === 'all';

  switch (board.audience) {
    case 'all':
      return r === 'GENERAL' || r === 'EMPLOYER';
    case 'women':
      return r === 'GENERAL';
    case 'employer':
      return r === 'EMPLOYER';
    default:
      return false;
  }
}

export function getDefaultCommunityTab(role?: string | null): string {
  const r = normalizeRole(role);
  if (r === 'EMPLOYER') return 'business';
  return 'free';
}

/** 역할별 노출 가능한 게시판 (사이드바·모바일 탭) */
export function getVisibleCommunityBoards(role?: string | null): CommunityBoardDef[] {
  return COMMUNITY_BOARDS;
}

/** 사이드바 섹션 그룹 */
export function getCommunitySidebarSections(role?: string | null) {
  const visible = getVisibleCommunityBoards(role);
  const order: CommunityAudience[] = ['all', 'women', 'employer'];
  return order
    .map((audience) => {
      const items = visible.filter((b) => b.audience === audience);
      if (!items.length) return null;
      return {
        title: COMMUNITY_AUDIENCE_LABELS[audience],
        items: items.map((b) => ({ id: b.id, label: b.label })),
      };
    })
    .filter(Boolean) as { title: string; items: { id: string; label: string }[] }[];
}

/** RA_CHECK_BOARD_PERMISSION용 role 배열 */
export function getAllowedRolesForBoard(boardId: string): string[] | null {
  const board = getCommunityBoard(boardId);
  if (!board) return null;
  switch (board.audience) {
    case 'all':
      return ['GENERAL', 'EMPLOYER', 'ADMIN', 'SUPER_ADMIN'];
    case 'women':
      return ['GENERAL', 'ADMIN', 'SUPER_ADMIN'];
    case 'employer':
      return ['EMPLOYER', 'ADMIN', 'SUPER_ADMIN'];
    default:
      return null;
  }
}

export function getBoardAccessDeniedMessage(boardId: string): string {
  const board = getCommunityBoard(boardId);
  const label = board?.label ?? boardId;
  if (board?.audience === 'employer') {
    return `${label}은(는) 업소(사업자) 회원 전용 게시판입니다.`;
  }
  if (board?.audience === 'women') {
    return `${label}은(는) 여성 회원 전용 게시판입니다.`;
  }
  return `${label}에 접근할 수 없습니다.`;
}
