import { nvLog } from '@/lib/logger';
import {
  getAllowedRolesForBoard,
  getBoardAccessDeniedMessage,
  getCommunityBoard,
  isAdminRole,
} from '@/lib/community-boards';

interface PermissionInput {
  board_id: string;
  user_role: string;
}

interface PermissionOutput {
  isValid: boolean;
  error?: string;
  data?: {
    forceAnonymous: boolean;
  };
}

export function RA_CHECK_BOARD_PERMISSION(input: PermissionInput): PermissionOutput {
  nvLog('AT', '▶️ RA_CHECK_BOARD_PERMISSION 시작', input);

  const { board_id, user_role } = input;
  const role = String(user_role ?? '')
    .trim()
    .replace(/\s+/g, '');

  const board = getCommunityBoard(board_id);
  if (!board) {
    return { isValid: false, error: '존재하지 않는 게시판입니다.' };
  }

  const allowedRoles = getAllowedRolesForBoard(board_id);
  if (!allowedRoles) {
    return { isValid: false, error: '존재하지 않는 게시판입니다.' };
  }

  if (isAdminRole(role)) {
    return {
      isValid: true,
      data: { forceAnonymous: board_id === 'report' },
    };
  }

  if (!allowedRoles.includes(role)) {
    return { isValid: false, error: getBoardAccessDeniedMessage(board_id) };
  }

  nvLog('AT', '✅ RA_CHECK_BOARD_PERMISSION 통과');
  return {
    isValid: true,
    data: { forceAnonymous: board_id === 'report' },
  };
}
