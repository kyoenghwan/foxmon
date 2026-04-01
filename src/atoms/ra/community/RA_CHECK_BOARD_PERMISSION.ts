import { nvLog } from '@/lib/logger';

/**
 * RA_CHECK_BOARD_PERMISSION
 * 게시판별 접근 권한을 검증하는 순수 함수
 * 외부 의존성 없음 (Rule Atom)
 */

const BOARD_PERMISSIONS: Record<string, string[]> = {
    free:      ['USER', 'EMPLOYER', 'ADMIN', 'SUPER_ADMIN'],
    foxtalk:   ['USER'],
    foxmarket: ['USER'],
    reviews:   ['USER'],
    tips:      ['USER'],
    report:    ['USER'],
    business:  ['EMPLOYER'],
};

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

    // 1. 게시판 존재 여부
    const allowedRoles = BOARD_PERMISSIONS[board_id];
    if (!allowedRoles) {
        return { isValid: false, error: '존재하지 않는 게시판입니다.' };
    }

    // 2. ADMIN/SUPER_ADMIN은 모든 게시판 접근 가능
    if (user_role === 'ADMIN' || user_role === 'SUPER_ADMIN') {
        return {
            isValid: true,
            data: { forceAnonymous: board_id === 'report' },
        };
    }

    // 3. 일반 권한 체크
    if (!allowedRoles.includes(user_role)) {
        const boardLabels: Record<string, string> = {
            foxtalk: '폭스수다', foxmarket: '폭스중고', reviews: '업소후기',
            tips: '꿀팁·노하우', report: '업소제보', business: '업소장터',
        };
        const label = boardLabels[board_id] || board_id;

        if (board_id === 'business') {
            return { isValid: false, error: `${label}은(는) 사업자 회원만 이용할 수 있습니다.` };
        }
        return { isValid: false, error: `${label}은(는) 여성 회원 전용 게시판입니다.` };
    }

    nvLog('AT', '✅ RA_CHECK_BOARD_PERMISSION 통과');
    return {
        isValid: true,
        data: { forceAnonymous: board_id === 'report' },
    };
}
