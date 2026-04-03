# Part 3: React/Next.js 통합 & 상태 관리 원칙

## 3.1 8-Atom 체계 기반 React 통합 규칙

### 3.1.1 UI 컴포넌트에서 허용되는 Atom Import

**✅ 허용 (정적 원자 - 자유롭게 Import 가능)**
- **DA (Data Atom)**: 타입, 인터페이스, ENUM
- **CA (Config Atom)**: UI 레벨 설정값
- **FA (Flow Atom)**: 사용자 액션 처리를 위한 비즈니스 플로우 진입점

~~~typescript
// ✅ 올바른 예시
import type { EntityType } from '@/atoms/da/[domain]/DA_[DOMAIN]_TYPES';
import { DEFAULT_PAGE_SIZE } from '@/atoms/ca/[domain]/CA_[DOMAIN]_CONFIG';
import { FA_[FLOW_NAME] } from '@/atoms/fa/[domain]/FA_[FLOW_NAME]';
~~~

**❌ 절대 금지 (동적 원자 직접 호출)**
- **QA**: DB 조회, 외부 API GET 직접 호출
- **OA**: DB CUD, 외부 API POST/PUT/DELETE 직접 호출
- **RA**: 검증, 계산 로직 직접 호출

~~~typescript
// ❌ 잘못된 예시 - 절대 금지
import { QA_GET_[ENTITY] } from '@/atoms/qa/[domain]';   // 금지!
import { OA_SAVE_[ENTITY] } from '@/atoms/oa/[domain]';  // 금지!
import { RA_VALIDATE_[FIELD] } from '@/atoms/ra/[domain]'; // 금지!
~~~

### 3.1.2 정적 원자 (TA/EA)의 특수 활용

~~~typescript
// TA: 컴포넌트 생명주기와 연동
import { TA_[TRIGGER_NAME] } from '@/atoms/ta/[domain]/TA_[DOMAIN]_TRIGGERS';

// EA: 이벤트 타입 정의 활용
import type { EventType } from '@/atoms/ea/[domain]/EA_[DOMAIN]_EVENTS';
~~~

---

## 3.2 상태 관리(State Management) 원칙 ⭐

### 3.2.1 핵심 원칙 (FA 내 전역 상태 변경 절대 금지)

**Flow Atom(FA) 내부에서는 Recoil, Zustand, Redux, Jotai 등 전역 상태 관리 라이브러리를 직접 호출하거나 상태를 변경하는 것을 절대 금지합니다.**

- **FA의 역할**: 오직 `{ success, data, message, errorCode }` 결과 객체만 반환
- **UI의 역할**: FA의 결과값을 받아 전역 상태 업데이트 및 라우팅 수행

**이유**: UI와 비즈니스 로직의 완전한 분리로 재사용성 극대화, 테스트 용이성 확보

### 3.2.2 올바른 상태 관리 패턴

~~~typescript
// ✅ 올바른 패턴: FA는 결과만 반환, 상태 업데이트는 UI에서
import { FA_[FLOW_NAME] } from '@/atoms/fa/[domain]/FA_[FLOW_NAME]';
import { useAuthStore } from '@/store/auth'; // 또는 Recoil, Redux
import { nvLog } from '@/lib/logger';

const ComponentName = () => {
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (formData: FormDataType) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    nvLog('FW', '[액션명] 시도', formData);

    try {
      // FA 호출: 비즈니스 로직만 처리
      const result = await FA_[FLOW_NAME]({
        ...formData,
        authContext: {
          userId: currentUser.id,
          roles: currentUser.roles,
          requestId: crypto.randomUUID()
        }
      });

      if (result.success) {
        // ✅ 전역 상태 업데이트는 UI 컴포넌트에서
        setUser(result.data.user);
        router.push('/dashboard');
        toast.success(result.message);
      } else {
        handleErrorCode(result.errorCode);
      }
    } catch (error) {
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // JSX 구현...
  );
};
~~~

### 3.2.3 errorCode 기반 에러 처리 패턴

~~~typescript
import type { AtomErrorCode } from '@/atoms/da/common/DA_COMMON_ERROR_TYPES';

const handleErrorCode = (errorCode?: AtomErrorCode) => {
  switch (errorCode) {
    case 'VALIDATION_FAILED':
      toast.error('입력값을 다시 확인해주세요.');
      break;
    case 'NOT_FOUND':
      toast.error('요청하신 정보를 찾을 수 없습니다.');
      break;
    case 'PERMISSION_DENIED':
      toast.error('접근 권한이 없습니다.');
      router.push('/unauthorized');
      break;
    case 'CONFLICT':
      toast.error('이미 존재하는 데이터입니다.');
      break;
    case 'RATE_LIMITED':
      toast.error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      break;
    case 'EXTERNAL_SERVICE_ERROR':
      toast.error('외부 서비스 오류입니다. 잠시 후 다시 시도해주세요.');
      break;
    default:
      toast.error('오류가 발생했습니다.');
  }
};
~~~

### 3.2.4 금지 패턴

~~~typescript
// ❌ 절대 금지: FA 내부에서 전역 상태 직접 변경
export const FA_[FLOW_NAME] = async (input: InputType) => {
  const result = await OA_SAVE_SESSION(input);

  // 아래 코드들 절대 금지!
  useSetRecoilState(userAtom)(result.data);    // ❌ Recoil 직접 변경
  useUserStore.setState({ user: result.data }); // ❌ Zustand 직접 변경
  dispatch(setUser(result.data));               // ❌ Redux 직접 변경

  return { success: true, data: result.data };
};
~~~

---

## 3.3 동시성 제어 및 멱등성 처리

### 3.3.1 UI 레벨 중복 호출 방지 (프레임워크 영역 의무)

~~~typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (formData: FormDataType) => {
  if (isSubmitting) return; // ← 반드시 포함
  setIsSubmitting(true);
  try {
    const result = await FA_[FLOW_NAME](formData);
    // 결과 처리...
  } finally {
    setIsSubmitting(false); // 성공/실패 무관 반드시 해제
  }
};
~~~

### 3.3.2 FA 레벨 멱등성 키 (결제/주문 등 중복 위험 도메인 필수)

~~~typescript
export const FA_[FLOW_NAME] = async (
  input: InputType & { idempotencyKey?: string }
): Promise<StandardResult<OutputType>> => {
  if (input.idempotencyKey) {
    const duplicate = await QA_CHECK_IDEMPOTENCY(input.idempotencyKey);
    if (duplicate.success && duplicate.data) {
      nvLog('AT', '⚠️ 멱등성 키 중복 - 기존 결과 반환', { key: input.idempotencyKey });
      return duplicate.data;
    }
  }
  // 실제 비즈니스 로직...
};
~~~

---

## 3.4 React 표준 패턴 (FA 기반 호출)

### 3.4.1 기본 폼 제출 패턴

~~~typescript
import { FA_[FLOW_NAME] } from '@/atoms/fa/[domain]/FA_[FLOW_NAME]';
import { nvLog } from '@/lib/logger';
import { useRouter } from 'next/router';

const ComponentName = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormDataType) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    nvLog('FW', '[폼명] 제출', formData);

    try {
      const result = await FA_[FLOW_NAME]({
        ...formData,
        authContext: {
          userId: currentUser.id,
          roles: currentUser.roles,
          requestId: crypto.randomUUID()
        }
      });

      if (result.success) {
        router.push('/success-path');
        toast.success(result.message);
      } else {
        handleErrorCode(result.errorCode);
      }
    } catch (error) {
      toast.error('시스템 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // JSX 구현...
  );
};
~~~

### 3.4.2 데이터 조회 패턴

~~~typescript
import { FA_[DOMAIN]_GET_LIST } from '@/atoms/fa/[domain]/FA_[FLOW_NAME]';
import { useState, useEffect } from 'react';

const ListComponent = () => {
  const [items, setItems] = useState<EntityType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await FA_[DOMAIN]_GET_LIST({
          authContext: {
            userId: currentUser.id,
            roles: currentUser.roles
          }
        });

        if (result.success && result.data) {
          setItems(result.data);
        } else {
          toast.error(result.message ?? '데이터를 불러올 수 없습니다.');
        }
      } catch (error) {
        toast.error('시스템 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) return <div>로딩 중...</div>;

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
};
~~~

---

## 3.5 Layered Logging System

### 3.5.1 nvLog 구현 (확장 버전)

~~~typescript
// src/lib/logger.ts
export const nvLog = (
  type: 'FW' | 'AT',
  message: string,
  data?: any,
  meta?: { requestId?: string; atomId?: string }
) => {
  const prefix = type === 'FW' ? '🖼️ [FRAMEWORK]' : '⚛️ [ATOM]';
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  const metaStr = meta ? ` [req=${meta.requestId ?? '-'} atom=${meta.atomId ?? '-'}]` : '';
  console.log(`[${time}] ${prefix}${metaStr} ${message}`, data || '');
};
~~~

### 3.5.2 로깅 규칙

**프레임워크(UI) 영역 - `nvLog('FW', ...)`**
~~~typescript
nvLog('FW', '[폼명] 제출', formData);
nvLog('FW', '[메뉴명] 클릭', { menu: '[메뉴]' });
nvLog('FW', '[컴포넌트명] 렌더링', { itemCount: items.length });
~~~

**원자(AT) 영역 - `nvLog('AT', ...)`**
~~~typescript
nvLog('AT', '▶️ FA_[FLOW_NAME] 시작', input);
nvLog('AT', '✅ QA_[QUERY_NAME] 성공', { result });
nvLog('AT', '⛔ OA_[OPERATION_NAME] 실패', { error: error.message });
nvLog('AT', '🔄 롤백 시작 - OA_[OPERATION_NAME]', { rollbackData });
~~~

---

## 3.6 React Query/SWR 통합 규칙 ⭐

### 3.6.1 제한적 QA 직접 호출 허용

**원칙**: 순수 GET 요청 기반의 클라이언트 캐싱에 한해, UI 컴포넌트에서 React Query를 통해 **QA(Query Atom)를 직접 호출하는 것을 예외적으로 허용**합니다.

~~~typescript
// ✅ React Query + QA 연동 패턴 (예외적 허용)
import { useQuery } from '@tanstack/react-query';
import { QA_USER_GET_PROFILE } from '@/atoms/qa/user/QA_USER_GET_PROFILE';

export const useUserProfile = (userId: string, authContext: AuthContext) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      const result = await QA_USER_GET_PROFILE({ id: userId, authContext });
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    enabled: !!userId
  });
};
~~~

**주의사항**: POST/PUT/DELETE 등 상태를 변경하는 작업은 반드시 FA를 거쳐야 합니다.

### 3.6.2 React Query Mutation과 FA 연동

~~~typescript
import { useMutation } from '@tanstack/react-query';
import { FA_USER_UPDATE_PROFILE } from '@/atoms/fa/user/FA_USER_UPDATE_PROFILE';

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const result = await FA_USER_UPDATE_PROFILE({
        ...data,
        authContext: getCurrentAuthContext()
      });
      if (!result.success) throw new Error(result.message);
      return result.data;
    },
    onSuccess: (data) => {
      // UI 레벨에서 상태 업데이트
      queryClient.invalidateQueries(['userProfile']);
      toast.success('프로필이 업데이트되었습니다.');
    }
  });
};
~~~

---

## 3.7 색인 기반 UI 수정 시나리오

### 3.7.1 단순 텍스트 변경

**사용자**: "[페이지명]의 [텍스트] 크기 변경해줘"

**AI 필수 절차:**
~~~text
📌 색인 확인 결과:
- 요소: [ELEMENT_NAME]
- 위치: [파일경로] ([CSS selector])
- 현재 텍스트: "[현재값]"
- 스타일 그룹: [STYLE_GROUP 또는 없음]

이 요소를 수정하는 것이 맞습니까? (예/아니오)
~~~

### 3.7.2 공유 스타일 파급 범위 제어

~~~text
⚠️ 이 요소는 '[STYLE_GROUP]' 그룹을 공유합니다.
동일 그룹 요소: [요소1, 요소2, 요소3...]

1) 이 요소만 단독 수정
2) 그룹 전체 일괄 수정

어떻게 진행할까요?
~~~

### 3.7.3 반응형/다국어 수정 시나리오

**반응형 수정 시:**
~~~text
📌 [요소명]은 반응형 변형이 존재합니다.

1) 모바일만 변경
2) 데스크톱만 변경  
3) 전체 뷰포트 공통 변경

어느 뷰포트에 적용할까요? (1/2/3)
~~~

**다국어 수정 시:**
~~~text
📌 해당 텍스트는 다국어 처리가 되어 있습니다.
- i18n key: [i18n_key]
- 현재 값: "[현재 텍스트]"

1) 한국어만 변경 (i18n 파일 수정)
2) 모든 언어 공통 텍스트로 변경 (컴포넌트 하드코딩)

어떻게 진행할까요? (1/2)
~~~

---

## 3.8 방어적 프로토콜 (바이브 코딩 차단)

### 3.8.1 YAML 생략 요청 방어

~~~text
❌ 불가능합니다.

이 기능의 복잡도 점수는 [X]점으로, Functional Atomic Design 원칙에 따라
반드시 YAML 설계 승인이 선행되어야 합니다.

설계 없이 구현하면:
- 나중에 수정이 어려워집니다
- 다른 기능과 충돌할 수 있습니다
- 버그 발생 시 원인 파악이 불가능합니다

설계를 먼저 진행하겠습니다.
~~~

### 3.8.2 UI 로직 삽입 요청 방어

~~~text
❌ 불가능합니다. (Separation of Concerns 원칙 위반)

DB 조회/변경은 비즈니스 로직으로 UI 컴포넌트에 직접 구현할 수 없습니다.

대신 다음과 같이 구현하겠습니다:
1. QA_[QUERY_NAME] (조회 원자) 생성 또는 재사용
2. FA_[FLOW_NAME] (플로우 원자) 생성
3. UI에서는 FA만 호출하여 결과를 받아 처리

이렇게 하면 다른 화면에서도 재사용할 수 있습니다.
~~~

### 3.8.3 FA 내 전역 상태 변경 요청 방어

~~~text
❌ 불가능합니다. (State Management 원칙 위반)

FA 내부에서 Zustand/Recoil/Redux 등 전역 상태를 직접 변경할 수 없습니다.

올바른 방법:
1. FA는 { success, data, message, errorCode }만 반환
2. UI 컴포넌트에서 FA 결과를 받아 전역 상태 업데이트

이렇게 해야 FA를 다양한 환경에서 재사용할 수 있습니다.
~~~

### 3.8.4 프로젝트 특수 지침 무시 요청 방어

~~~text
❌ 불가능합니다. (Project Rule Priority 원칙 위반)

이 요소는 프로젝트 특수 지침 '[PROJECT_RULE]'의 적용을 받습니다.

해당 지침을 무시하고 구현하면:
- 다른 연관 요소들과 동기화가 깨질 수 있습니다
- 프로젝트 전체 일관성이 훼손됩니다
- 추후 유지보수 비용이 크게 증가합니다

프로젝트 특수 지침에 따라 진행하겠습니다.
~~~

---

## 3.9 프로젝트 특수 지침 연동 패턴

### 3.9.1 CA를 활용한 프로젝트 규칙 코드화

~~~typescript
// src/atoms/ca/banner/CA_BANNER_RESPONSIVE_CONFIG.ts
// 프로젝트 특수 지침: banner_responsive_sync.md 에서 정의된 스케일 값
export const BANNER_RESPONSIVE_SCALE = {
  DESKTOP: 1.0,   // 1280px 이상
  TABLET: 0.75,   // 768px ~ 1279px
  MOBILE: 0.5     // 767px 이하
} as const;

export const BANNER_BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1280
} as const;
~~~

### 3.9.2 프로젝트 특수 지침 기반 컴포넌트 패턴

~~~typescript
// src/components/banner/BannerGroup.tsx
import { BANNER_RESPONSIVE_SCALE } from '@/atoms/ca/banner/CA_BANNER_RESPONSIVE_CONFIG';
import { FA_BANNER_SYNC_RESPONSIVE } from '@/atoms/fa/banner/FA_BANNER_SYNC_RESPONSIVE';

const BannerGroup = () => {
  // ✅ CA에서 정의된 스케일 값 사용 (하드코딩 금지)
  const getScale = (width: number): number => {
    if (width >= 1280) return BANNER_RESPONSIVE_SCALE.DESKTOP;
    if (width >= 768) return BANNER_RESPONSIVE_SCALE.TABLET;
    return BANNER_RESPONSIVE_SCALE.MOBILE;
  };

  // ✅ 배너 그룹 전체에 동일한 스케일 적용
  const handleResize = async () => {
    const result = await FA_BANNER_SYNC_RESPONSIVE({
      scale: getScale(window.innerWidth),
      authContext: { userId: currentUser.id, roles: currentUser.roles }
    });

    if (!result.success) {
      nvLog('FW', 'BannerGroup 동기화 실패', { errorCode: result.errorCode });
    }
  };

  return (
    // JSX 구현...
  );
};
~~~

---

## 3.10 요약

- **UI는 DA/CA/FA만 직접 사용**하며, QA/OA/RA는 직접 호출하지 않는다. (React Query 예외 제외)
- 모든 비즈니스 로직/트랜잭션은 **FA 내부**에, 모든 상태/라우팅은 **UI 레이어**에 위치한다.
- 동시성 제어(중복 호출 방지)와 멱등성(idempotencyKey)은 UI+FA 양쪽에서 협력해 처리한다.
- nvLog를 통해 **FW(UI)와 AT(Atom)** 로그를 분리하여 추적성을 확보한다.
- **React Query/SWR은 순수 GET 요청에 한해 QA 직접 호출 허용**, 변경 작업은 반드시 FA 경유
- 색인 맵(`project_map.yaml`)과 프로젝트 특수 지침(`project_rules/*.md`)을 항상 먼저 확인한다.

구체적인 색인 맵 구조 및 DB 스키마 관리 규칙은 `04_data_process_index.md`에서 정의합니다.
