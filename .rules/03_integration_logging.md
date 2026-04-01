# Part 3: React/Next.js 통합 & 로깅

## 3.1 React 표준 패턴

```typescript
import { userRegistrationFlow } from '@/atoms/flows/user';
import { nvLog } from '@/lib/logger';

const handleSubmit = async (formData) => {
  // 1. 프레임워크 로깅
  nvLog('FW', '회원가입 폼 제출', formData);
  
  try {
    // 2. Flow Atom 호출 (비즈니스 로직 완전 위임)
    const result = await userRegistrationFlow(formData);
    
    // 3. 결과에 따른 UI 상태만 변경
    if (result.success) {
      router.push('/dashboard');
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    toast.error('시스템 오류가 발생했습니다.');
  }
};
```

## 3.2 금지 패턴

```typescript
// ❌ 절대 금지: UI 컴포넌트에서 직접 비즈니스 로직
const handleSubmit = async () => {
  const user = await fetch('/api/user'); // 금지!
  if (user.role === 'ADMIN') { ... }     // 금지!
};
```

## 3.3 Layered Logging System

### nvLog 구현

```typescript
// src/lib/logger.ts
export const nvLog = (type: 'FW' | 'AT', message: string, data?: any) => {
  const prefix = type === 'FW' ? '🖼️ [FRAMEWORK]' : '⚛️ [ATOM]';
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${time}] ${prefix} ${message}`, data || '');
};
```

### 로깅 규칙
- **프레임워크 영역**: `nvLog('FW', '로그인 폼 제출', formData)`
- **원자 영역**: `nvLog('AT', '▶️ FA_LOGIN_FLOW 시작', input)`

## 3.4 색인 기반 UI 수정 시나리오

### 단순 텍스트 변경 예시
사용자: "로그인의 FOXMON 텍스트 크기 변경해줘"

AI 응답:
```text
📌 색인 확인 결과:
- 요소: LOGIN_MODAL_LOGO_TEXT
- 위치: src/components/auth/LoginModal.tsx (.login-logo-text)
- 현재 텍스트: "FOXMON"
- 스타일 그룹: BRAND_LOGO_TEXT

이 요소의 폰트 크기를 변경하는 것이 맞습니까? (예/아니오)
```

### 공유 스타일 변경 예시
사용자: "홈 메뉴 크기 변경해줘"

AI 응답:
```text
📌 '홈'은 NAV_MENU_ITEMS 스타일 그룹에 속합니다.
동일 그룹: [홈, 구인정보, 인재정보, 커뮤니티, 고객센터]

1) 홈만 단독 변경
2) 상단 메뉴 그룹 전체 변경

어떻게 진행할까요?
```

## 3.5 방어적 프로토콜

**사용자**: "이 컴포넌트에 DB 조회 로직 넣어줘"

**AI 응답 (강제)**:
```text
❌ 불가능합니다.

DB 조회는 비즈니스 로직으로 UI에 직접 구현할 수 없습니다.
대신 다음과 같이 구현하겠습니다:

1. QA_GET_USER_DATA (조회 원자) 생성
2. UI에서는 이 원자만 호출

이렇게 하면 다른 화면에서도 재사용할 수 있습니다.
```
