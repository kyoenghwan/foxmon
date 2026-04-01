import { nvLog } from '@/lib/logger';

/**
 * RA_VALIDATE_POST_INPUT
 * 게시글 입력값 검증 순수 함수
 */

interface PostInput {
    title: string;
    content: string;
    board_id: string;
    thumbnail?: string | null;
    price?: string | null;
}

interface ValidationOutput {
    isValid: boolean;
    error?: string;
}

export function RA_VALIDATE_POST_INPUT(input: PostInput): ValidationOutput {
    nvLog('AT', '▶️ RA_VALIDATE_POST_INPUT 시작', { title: input.title?.substring(0, 20) });

    const { title, content, board_id } = input;

    if (!title || title.trim().length < 2) {
        return { isValid: false, error: '제목을 2자 이상 입력해주세요.' };
    }

    if (title.trim().length > 100) {
        return { isValid: false, error: '제목은 100자 이내로 입력해주세요.' };
    }

    if (!content || content.trim().length < 5) {
        return { isValid: false, error: '내용을 5자 이상 입력해주세요.' };
    }

    if (content.trim().length > 10000) {
        return { isValid: false, error: '내용은 10,000자 이내로 작성해주세요.' };
    }

    // foxmarket 게시판은 가격 입력 권장 (필수는 아님)

    nvLog('AT', '✅ RA_VALIDATE_POST_INPUT 통과');
    return { isValid: true };
}
