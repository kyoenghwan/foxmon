# Part 3: React/Next.js 통합 & 상태 관리 원칙

## 3.1 8-Atom 체계 기반 React 통합 규칙

### 3.1.1 UI 컴포넌트에서 허용되는 Atom Import

**✅ 허용 (정적 원자 - 자유롭게 Import 가능)**
- **DA (Data Atom)**: 타입, 인터페이스, ENUM
- **CA (Config Atom)**: UI 레벨 설정값
- **FA (Flow Atom)**: 사용자 액션 처리를 위한 비즈니스 플로우 진입점

```typescript
// ✅ 올바른 예시
import type { [EntityType] } from '@/atoms/da/[domain]Types';
import { DEFAULT_PAGE_SIZE } from '@/atoms/ca/[domain]Config';
import { [actionFlow] } from '@/atoms/fa/[domain]';
```

**❌ 절대 금지 (동적 원자 직접 호출)**
- **QA**: DB 조회, 외부 API GET 직접 호출
- **OA**: DB CUD, 외부 API POST/PUT/DELETE 직접 호출
- **RA**: 검증, 계산 로직 직접 호출

```typescript
// ❌ 잘못된 예시 - 절대 금지
import { QA_GET_[ENTITY] } from '@/atoms/qa/[domain]';   // 금지!
import { OA_SAVE_[ENTITY] } from '@/atoms/oa/[domain]';  // 금지!
import { RA_VALIDATE_[FIELD] } from '@/atoms/ra/[domain]'; // 금지!
```

### 3.1.2 정적 원자 (TA/EA)의 특수 활용

```typescript
// TA: 컴포넌트 생명주기와 연동
import { [TRIGGER_NAME] } from '@/atoms/ta/[domain]Events';

// EA: 이벤트 타입 정의 활용
import type { [EventType] } from '@/atoms/ea/[domain]Events';
```

---

## 3.2 상태 관리(State Management) 원칙 ⭐ NEW

### 3.2.1 핵심 원칙 (FA 내 전역 상태 변경 절대 금지)

**Flow Atom(FA) 내부에서는 Recoil, Zustand, Redux, Jotai 등 전역 상태 관리 라이브러리를 직접 호출하거나 상태를 변경하는 것을 절대 금지합니다.**

- **FA의 역할**: 오직 `{ success, data, message }` 결과 객체만 반환
- **UI의 역할**: FA의 결과값을 받아 전역 상태 업데이트 및 라우팅 수행

**이유**: UI와 비즈니스 로직의 완전한 분리로 재사용성 극대화, 테스트 용이성 확보

### 3.2.2 올바른 상태 관리 패턴

```typescript
// ✅ 올바른 패턴: FA는 결과만 반환, 상태 업데이트는 UI에서
import { [actionFlow] } from '@/atoms/fa/[domain]';
import { useAuthStore } from '@/store/auth'; // 또는 Recoil, Redux

const [ComponentName] = () => {
  const setUser = useAuthStore((state) => state.setUser);

  const handleAction = async (formData: [FormDataType]) => {
    nvLog('FW', '[액션명] 시도', formData);

    // FA 호출: 비즈니스 로직만 처리
    const result = await [actionFlow](formData);

    if (result.success) {
      // ✅ 전역 상태 업데이트는 UI 컴포넌트에서
      setUser(result.data.user);
      router.push('/dashboard');
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    // JSX 구현...
  );
};
```

### 3.2.3 금지 패턴

```typescript
// ❌ 절대 금지: FA 내부에서 전역 상태 직접 변경
export const [actionFlow] = async (input: [InputType]) => {
  const result = await OA_SAVE_SESSION(input);

  // 아래 코드들 절대 금지!
  useSetRecoilState(userAtom)(result.data);    // ❌ Recoil 직접 변경
  useUserStore.setState({ user: result.data }); // ❌ Zustand 직접 변경
  dispatch(setUser(result.data));               // ❌ Redux 직접 변경

  return { success: true, data: result.data };
};
```

---

## 3.3 React 표준 패턴 (FA 기반 호출)

```typescript
import { [actionFlow] } from '@/atoms/flows/[domain]';
import { nvLog } from '@/lib/logger';
import { useRouter } from 'next/router';

const [ComponentName] = () => {
  const router = useRouter();

  const handleSubmit = async (formData: [FormDataType]) => {
    // 1. 프레임워크 레벨 로깅
    nvLog('FW', '[액션명] 폼 제출', formData);

    try {
      // 2. Flow Atom 호출 (비즈니스 로직 완전 위임)
      const result = await [actionFlow](formData);

      // 3. 결과에 따른 UI 상태만 변경
      if (result.success) {
        router.push('/[success-path]');
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('시스템 오류가 발생했습니다.');
    }
  };

  return (
    // JSX 구현...
  );
};
```

---

## 3.4 Layered Logging System

### 3.4.1 nvLog 구현

```typescript
// src/lib/logger.ts
export const nvLog = (type: 'FW' | 'AT', message: string, data?: any) => {
  const prefix = type === 'FW' ? '🖼️ [FRAMEWORK]' : '⚛️ [ATOM]';
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${time}] ${prefix} ${message}`, data || '');
};
```

### 3.4.2 로깅 규칙

**프레임워크(UI) 영역 - `nvLog('FW', ...)`**
```typescript
nvLog('FW', '[폼명] 제출', formData);
nvLog('FW', '[메뉴명] 클릭', { menu: '[메뉴]' });
nvLog('FW', '[컴포넌트명] 렌더링', { itemCount: items.length });
```

**원자(AT) 영역 - `nvLog('AT', ...)`**
```typescript
nvLog('AT', '▶️ FA_[FLOW_NAME] 시작', input);
nvLog('AT', '✅ QA_[QUERY_NAME] 성공', { result });
nvLog('AT', '⛔ OA_[OPERATION_NAME] 실패', { error: error.message });
nvLog('AT', '🔄 롤백 시작 - OA_[OPERATION_NAME]', { rollbackData });
```

---

## 3.5 색인 기반 UI 수정 시나리오

### 3.5.1 단순 텍스트 변경

**사용자 요청:**
> "[페이지명]의 [텍스트] 크기 변경해줘"

**AI 필수 절차:**
1. `docs/project_map.yaml`에서 키워드 검색
2. 대상 요소 확인 질문:

```text
📌 색인 확인 결과:
- 요소: [ELEMENT_NAME]
- 위치: [파일경로] ([CSS selector])
- 현재 텍스트: "[현재값]"
- 스타일 그룹: [STYLE_GROUP 또는 없음]

이 요소를 수정하는 것이 맞습니까? (예/아니오)
```

### 3.5.2 공유 스타일 파급 범위 제어

**사용자 요청:**
> "[메뉴명] 크기 변경해줘"

**AI 응답:**
```text
📌 '[요소명]'은 '[STYLE_GROUP]' 스타일 그룹에 속합니다.

⚠️ 동일한 스타일을 공유하는 요소들:
- [요소1], [요소2], [요소3]...

어떻게 적용할까요?
1) '[요소명]'만 단독 변경 (예외 스타일)
2) '[STYLE_GROUP]' 그룹 전체 일괄 변경

선택: (1/2)
```

### 3.5.3 반응형/다국어 수정 시나리오

**반응형 수정 시:**
```text
📌 [요소명]은 반응형 변형이 존재합니다.

1) 모바일만 변경
2) 데스크톱만 변경  
3) 전체 뷰포트 공통 변경

어느 뷰포트에 적용할까요? (1/2/3)
```

**다국어 수정 시:**
```text
📌 해당 텍스트는 다국어 처리가 되어 있습니다.
- i18n key: [i18n_key]
- 현재 값: "[현재 텍스트]"

1) 한국어만 변경 (i18n 파일 수정)
2) 모든 언어 공통 텍스트로 변경 (컴포넌트 하드코딩)

어떻게 진행할까요? (1/2)
```

---

## 3.6 방어적 프로토콜 (바이브 코딩 차단)

### 3.6.1 YAML 생략 요청 방어

```text
❌ 불가능합니다.

이 기능의 복잡도 점수는 [X]점으로, Functional Atomic Design 원칙에 따라
반드시 YAML 설계 승인이 선행되어야 합니다.

설계 없이 구현하면:
- 나중에 수정이 어려워집니다
- 다른 기능과 충돌할 수 있습니다
- 버그 발생 시 원인 파악이 불가능합니다

설계를 먼저 진행하겠습니다.
```

### 3.6.2 UI 로직 삽입 요청 방어

```text
❌ 불가능합니다. (Separation of Concerns 원칙 위반)

DB 조회/변경은 비즈니스 로직으로 UI 컴포넌트에 직접 구현할 수 없습니다.

대신 다음과 같이 구현하겠습니다:
1. QA_[QUERY_NAME] (조회 원자) 생성 또는 재사용
2. FA_[FLOW_NAME] (플로우 원자) 생성
3. UI에서는 FA만 호출하여 결과를 받아 처리

이렇게 하면 다른 화면에서도 재사용할 수 있습니다.
```

### 3.6.3 FA 내 전역 상태 변경 요청 방어 ⭐ NEW

```text
❌ 불가능합니다. (State Management 원칙 위반)

FA 내부에서 Zustand/Recoil/Redux 등 전역 상태를 직접 변경할 수 없습니다.

올바른 방법:
1. FA는 { success, data, message }만 반환
2. UI 컴포넌트에서 FA 결과를 받아 전역 상태 업데이트

이렇게 해야 FA를 다양한 환경에서 재사용할 수 있습니다.
```
