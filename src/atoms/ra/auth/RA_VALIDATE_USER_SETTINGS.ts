import { nvLog } from '../../../../lib/logger';

export function RA_VALIDATE_USER_SETTINGS(input: {
    nickname?: string;
    phoneNumber?: string;
    currentPassword?: string;
    newPassword?: string;
}) {
    nvLog('AT', '▶️ RA_VALIDATE_USER_SETTINGS 시작', input);

    const data: any = {};
    const isPasswordChange = !!(input.currentPassword && input.newPassword);
    data.isPasswordChange = isPasswordChange;

    if (input.nickname) {
        if (input.nickname.length < 2 || input.nickname.length > 20) {
            return {
                isValid: false,
                error: '닉네임은 2~20자 사이로 입력해주세요.',
                data
            };
        }
    }

    if (input.phoneNumber) {
        // 간단한 정규식으로 010 패턴 형식 체크 (10~11자리 숫자 또는 하이픈 포함)
        const phoneRegex = /^(010)[-\s]?\d{3,4}[-\s]?\d{4}$/;
        if (!phoneRegex.test(input.phoneNumber)) {
            return {
                isValid: false,
                error: '올바른 형식의 010 휴대폰 번호를 입력해주세요.',
                data
            };
        }
    }

    if (input.newPassword) {
        if (!input.currentPassword) {
            return {
                isValid: false,
                error: '비밀번호를 변경하려면 기존 비밀번호를 입력해야 합니다.',
                data
            };
        }
        if (input.newPassword.length < 6) {
            return {
                isValid: false,
                error: '새 비밀번호는 최소 6자 이상이어야 합니다.',
                data
            };
        }
    }

    if (input.currentPassword && !input.newPassword) {
         return {
             isValid: false,
             error: '변경할 새 비밀번호를 입력해야 합니다.',
             data
         };
    }

    nvLog('AT', '✅ RA_VALIDATE_USER_SETTINGS 검증 통과');
    return {
        isValid: true,
        error: null,
        data
    };
}
